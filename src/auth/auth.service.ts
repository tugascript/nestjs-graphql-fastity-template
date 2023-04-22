/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { Cache } from 'cache-manager';
import { isEmail } from 'class-validator';
import { randomBytes } from 'crypto';
import dayjs from 'dayjs';
import { v4 } from 'uuid';
import { CommonService } from '../common/common.service';
import { SLUG_REGEX } from '../common/constants/regex';
import { LocalMessageType } from '../common/entities/gql/message.type';
import { IUnion } from '../common/interfaces/union.interface';
import { IWsCtx } from '../config/interfaces/ws-ctx.interface';
import { isNull, isUndefined } from '../config/utils/validation.util';
import { EmailService } from '../email/email.service';
import { TokenTypeEnum } from '../jwt/enums/token-type.enum';
import { IAccessToken } from '../jwt/interfaces/access-token.interface';
import { IEmailToken } from '../jwt/interfaces/email-token.interface';
import { IRefreshToken } from '../jwt/interfaces/refresh-token.interface';
import { JwtService } from '../jwt/jwt.service';
import { UserEntity } from '../users/entities/user.entity';
import { OAuthProvidersEnum } from '../users/enums/oauth-providers.enum';
import { OnlineStatusEnum } from '../users/enums/online-status.enum';
import { ICredentials } from '../users/interfaces/credentials.interface';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ConfirmEmailDto } from './dtos/confirm-email.dto';
import { EmailDto } from './dtos/email.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { SignInDto } from './dtos/sign-in.dto';
import { SignUpDto } from './dtos/sign-up.dto';
import { IAuthResult } from './interfaces/auth-result.interface';
import { ISessionsData } from './interfaces/session-data.interface';

@Injectable()
export class AuthService {
  private readonly sessionTime: number;
  private readonly twoFactorTime: number;
  private readonly accessTime: number;
  private readonly twoFactorPrefix = 'two_factor';
  private readonly blacklistPrefix = 'blacklist';
  private readonly sessionsPrefix = 'sessions';

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly commonService: CommonService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.sessionTime = this.configService.get<number>('sessionTime');
    this.twoFactorTime = this.configService.get<number>('twoFactorTime');
    this.accessTime = this.configService.get<number>('jwt.access.time');
  }

  private static generateAccessCode(): string {
    return randomBytes(3).toString('hex').toUpperCase();
  }

  public async signUp(
    dto: SignUpDto,
    domain?: string,
  ): Promise<LocalMessageType> {
    const { name, email, password1, password2 } = dto;
    this.comparePasswords(password1, password2);
    const user = await this.usersService.create(
      OAuthProvidersEnum.LOCAL,
      email,
      name,
      password1,
    );
    const confirmationToken = await this.jwtService.generateToken(
      user,
      TokenTypeEnum.CONFIRMATION,
      domain,
    );
    this.emailService.sendConfirmationEmail(user, confirmationToken);
    return new LocalMessageType('Registration successful');
  }

  public async confirmEmail(
    dto: ConfirmEmailDto,
    domain?: string,
  ): Promise<IAuthResult> {
    const { confirmationToken } = dto;
    const { id, version } = await this.jwtService.verifyToken<IEmailToken>(
      confirmationToken,
      TokenTypeEnum.CONFIRMATION,
    );
    const user = await this.usersService.confirmEmail(id, version);
    return this.generateAuthResult(user, domain);
  }

  public async signIn(
    dto: SignInDto,
    domain?: string,
  ): Promise<
    IUnion<'auth', IAuthResult> | IUnion<'message', LocalMessageType>
  > {
    const { emailOrUsername, password } = dto;
    const user = await this.userByEmailOrUsername(emailOrUsername);

    if (!(await compare(password, user.password))) {
      await this.checkLastPassword(user.credentials, password);
    }
    if (!user.confirmed) {
      const confirmationToken = await this.jwtService.generateToken(
        user,
        TokenTypeEnum.CONFIRMATION,
        domain,
      );
      this.emailService.sendConfirmationEmail(user, confirmationToken);
      throw new UnauthorizedException(
        'Please confirm your email, a new email has been sent',
      );
    }
    if (user.twoFactor) {
      return {
        title: 'message',
        value: await this.saveTwoFactorCode(user),
      };
    }
    await this.usersService.updateInternal(user, { lastLogin: new Date() });
    return {
      title: 'auth',
      value: await this.generateAuthResult(user, domain),
    };
  }

  public async refreshTokenAccess(
    refreshToken: string,
    domain?: string,
  ): Promise<IAuthResult> {
    const { id, version, tokenId } =
      await this.jwtService.verifyToken<IRefreshToken>(
        refreshToken,
        TokenTypeEnum.REFRESH,
      );
    await this.checkIfTokenIsBlacklisted(id, tokenId);
    const user = await this.usersService.findOneByCredentials(id, version);
    return this.generateAuthResult(user, domain, tokenId);
  }

  public async updateTwoFactor(
    userId: number,
    twoFactor: boolean,
    refreshToken: string,
    domain?: string,
  ): Promise<IAuthResult> {
    const user = await this.usersService.findOneById(userId);

    if (user.twoFactor === twoFactor) {
      const { tokenId } = await this.jwtService.verifyToken<IRefreshToken>(
        refreshToken,
        TokenTypeEnum.REFRESH,
      );
      return this.generateAuthResult(user, domain, tokenId);
    }
    if (twoFactor) {
      user.credentials.updateVersion();
    }

    await this.usersService.updateInternal(user, { twoFactor });
    return this.generateAuthResult(user, domain);
  }

  public async logout(refreshToken: string): Promise<LocalMessageType> {
    const { id, tokenId, exp } =
      await this.jwtService.verifyToken<IRefreshToken>(
        refreshToken,
        TokenTypeEnum.REFRESH,
      );
    await this.blacklistToken(id, tokenId, exp);
    return new LocalMessageType('Logout successful');
  }

  public async resetPasswordEmail(
    dto: EmailDto,
    domain?: string,
  ): Promise<LocalMessageType> {
    const user = await this.usersService.uncheckedUserByEmail(dto.email);

    if (!isUndefined(user) && !isNull(user)) {
      const resetToken = await this.jwtService.generateToken(
        user,
        TokenTypeEnum.RESET_PASSWORD,
        domain,
      );
      this.emailService.sendResetPasswordEmail(user, resetToken);
    }

    return new LocalMessageType('Reset password email sent');
  }

  public async resetPassword(dto: ResetPasswordDto): Promise<LocalMessageType> {
    const { password1, password2, resetToken } = dto;
    const { id, version } = await this.jwtService.verifyToken<IEmailToken>(
      resetToken,
      TokenTypeEnum.RESET_PASSWORD,
    );
    this.comparePasswords(password1, password2);
    await this.usersService.resetPassword(id, version, password1);
    return new LocalMessageType('Password reset successfully');
  }

  public async updatePassword(
    userId: number,
    dto: ChangePasswordDto,
    domain?: string,
  ): Promise<IAuthResult> {
    const { password1, password2, password } = dto;
    this.comparePasswords(password1, password2);
    const user = await this.usersService.updatePassword(
      userId,
      password,
      password1,
    );
    const [accessToken, refreshToken] =
      await this.jwtService.generateAuthTokens(user, domain);
    return { user, accessToken, refreshToken };
  }

  public async generateWsSession(
    accessToken: string,
  ): Promise<[number, string]> {
    const { id } = await this.jwtService.verifyToken<IAccessToken>(
      accessToken,
      TokenTypeEnum.ACCESS,
    );
    const user = await this.usersService.findOneById(id);
    const sessionKey = `${this.sessionsPrefix}:${id}`;
    const count = user.credentials.version;
    let sessionData = await this.commonService.throwInternalError(
      this.cacheManager.get<ISessionsData>(sessionKey),
    );

    if (
      isUndefined(sessionData) ||
      isNull(sessionData) ||
      sessionData.count !== count
    ) {
      sessionData = {
        sessions: {},
        count,
      };
      user.onlineStatus = user.defaultStatus;
    }

    const sessionId = v4();
    sessionData.sessions[sessionId] = dayjs().unix();
    await this.saveSessionData(sessionKey, sessionData);
    return [id, sessionId];
  }

  public async closeUserSession(ctx: IWsCtx): Promise<void> {
    const { userId, sessionId } = ctx;
    const sessionKey = `${this.sessionsPrefix}:${userId}`;
    const sessionData = await this.getSessionData(ctx);
    delete sessionData.sessions[sessionId];

    if (Object.keys(sessionData.sessions).length === 0) {
      await this.commonService.throwInternalError(
        this.cacheManager.del(sessionKey),
      );
      await this.makeUserOffline(userId);
      return;
    }

    await this.saveSessionData(sessionKey, sessionData);
  }

  public async refreshUserSession(ctx: IWsCtx): Promise<void> {
    const { userId, sessionId } = ctx;
    const sessionKey = `${this.sessionsPrefix}:${userId}`;
    const sessionData = await this.getSessionData(ctx);
    const now = dayjs().unix();

    if (now - sessionData.sessions[sessionId] < this.accessTime) {
      return;
    }

    const user = await this.usersService.findOneById(userId);

    if (user.credentials.version !== sessionData.count) {
      await this.commonService.throwInternalError(
        this.cacheManager.del(sessionKey),
      );
      await this.makeUserOffline(userId);
      throw new UnauthorizedException('Session has expired');
    }

    sessionData.sessions[sessionId] = now;
    await this.saveSessionData(sessionKey, sessionData);
  }

  private async generateAuthResult(
    user: UserEntity,
    domain?: string,
    tokenId?: string,
  ): Promise<IAuthResult> {
    const [accessToken, refreshToken] =
      await this.jwtService.generateAuthTokens(user, domain, tokenId);
    return { user, accessToken, refreshToken };
  }

  private async makeUserOffline(userId: number): Promise<void> {
    const user = await this.usersService.findOneById(userId);
    await this.usersService.updateInternal(user, {
      lastOnline: new Date(),
      onlineStatus: OnlineStatusEnum.OFFLINE,
    });
  }

  private async getSessionData(ctx: IWsCtx): Promise<ISessionsData> {
    const { userId, sessionId } = ctx;
    const sessionKey = `${this.sessionsPrefix}:${userId}`;
    const sessionData = await this.commonService.throwInternalError(
      this.cacheManager.get<ISessionsData>(sessionKey),
    );

    if (
      isUndefined(sessionData) ||
      isNull(sessionData) ||
      isUndefined(sessionData.sessions[sessionId]) ||
      isNull(sessionData.sessions[sessionId])
    ) {
      await this.makeUserOffline(userId);
      throw new UnauthorizedException('Invalid session');
    }

    return sessionData;
  }

  private async checkLastPassword(
    credentials: ICredentials,
    password: string,
  ): Promise<void> {
    const { lastPassword, passwordUpdatedAt } = credentials;

    if (lastPassword.length === 0 || !(await compare(password, lastPassword))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const now = dayjs();
    const time = dayjs.unix(passwordUpdatedAt);
    const months = now.diff(time, 'month');
    const message = 'You changed your password ';

    if (months > 0) {
      throw new UnauthorizedException(
        message + months + (months > 1 ? ' months ago' : ' month ago'),
      );
    }

    const days = now.diff(time, 'day');

    if (days > 0) {
      throw new UnauthorizedException(
        message + days + (days > 1 ? ' days ago' : ' day ago'),
      );
    }

    const hours = now.diff(time, 'hour');

    if (hours > 0) {
      throw new UnauthorizedException(
        message + hours + (hours > 1 ? ' hours ago' : ' hour ago'),
      );
    }

    throw new UnauthorizedException(message + 'recently');
  }

  private async checkIfTokenIsBlacklisted(
    userId: number,
    tokenId: string,
  ): Promise<void> {
    const time = await this.cacheManager.get<number>(
      `blacklist:${userId}:${tokenId}`,
    );

    if (!isUndefined(time) && !isNull(time)) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async blacklistToken(
    userId: number,
    tokenId: string,
    exp: number,
  ): Promise<void> {
    const now = dayjs().unix();
    const ttl = (exp - now) * 1000;

    if (ttl > 0) {
      await this.commonService.throwInternalError(
        this.cacheManager.set(
          `${this.blacklistPrefix}:${userId}:${tokenId}`,
          now,
          ttl,
        ),
      );
    }
  }

  private comparePasswords(password1: string, password2: string): void {
    if (password1 !== password2) {
      throw new BadRequestException('Passwords do not match');
    }
  }

  private async userByEmailOrUsername(
    emailOrUsername: string,
  ): Promise<UserEntity> {
    if (emailOrUsername.includes('@')) {
      if (!isEmail(emailOrUsername)) {
        throw new BadRequestException('Invalid email');
      }

      return this.usersService.findOneByEmail(emailOrUsername);
    }

    if (
      emailOrUsername.length < 3 ||
      emailOrUsername.length > 106 ||
      !SLUG_REGEX.test(emailOrUsername)
    ) {
      throw new BadRequestException('Invalid username');
    }

    return this.usersService.findOneByUsername(emailOrUsername, true);
  }

  private async saveTwoFactorCode(user: UserEntity): Promise<LocalMessageType> {
    const code = AuthService.generateAccessCode();
    await this.commonService.throwInternalError(
      this.cacheManager.set(
        `${this.twoFactorPrefix}:${user.email}`,
        await hash(code, 5),
      ),
    );
    this.emailService.sendAccessCode(user, code);
    return new LocalMessageType('Two factor code sent');
  }

  private async saveSessionData(
    sessionKey: string,
    sessionData: ISessionsData,
  ): Promise<void> {
    await this.commonService.throwInternalError(
      this.cacheManager.set(sessionKey, sessionData, this.sessionTime * 1000),
    );
  }
}
