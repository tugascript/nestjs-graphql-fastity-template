/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  Logger,
  LoggerService,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { Cache } from 'cache-manager';
import { randomBytes } from 'crypto';
import dayjs from 'dayjs';
import { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidV4 } from 'uuid';
import { CommonService } from '../common/common.service';
import { LocalMessageType } from '../common/entities/gql/message.type';
import { IJwt, ISingleJwt } from '../config/interfaces/jwt.interface';
import { IWsCtx } from '../config/interfaces/ws-ctx.interface';
import { isNull, isUndefined } from '../config/utils/validation.util';
import { EmailService } from '../email/email.service';
import { TokenTypeEnum } from '../jwt/enums/token-type.enum';
import { IAccessToken } from '../jwt/interfaces/access-token.interface';
import { IEmailToken } from '../jwt/interfaces/email-token.interface';
import { IRefreshToken } from '../jwt/interfaces/refresh-token.interface';
import { JwtService } from '../jwt/jwt.service';
import { UserEntity } from '../users/entities/user.entity';
import { OnlineStatusEnum } from '../users/enums/online-status.enum';
import { ICredentials } from '../users/interfaces/credentials.interface';
import { IUser } from '../users/interfaces/user.interface';
import { UsersService } from '../users/users.service';
import { ChangeEmailDto } from './dtos/change-email.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ConfirmEmailDto } from './dtos/confirm-email.dto';
import { ConfirmLoginDto } from './dtos/confirm-login.dto';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { ResetEmailDto } from './dtos/reset-email.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { generateToken } from './helpers/async-jwt';
import { IAccessPayload } from './interfaces/access-payload.interface';
import { IAuthResult } from './interfaces/auth-result.interface';
import { ISessionsData } from './interfaces/sessions-data.interface';
import { ITokenPayload } from './interfaces/token-payload.interface';

@Injectable()
export class AuthService {
  private readonly loggerService: LoggerService;
  private readonly cookieName: string;
  private readonly testing: boolean;
  private readonly refreshTime: number;
  private readonly accessTime: number;
  private readonly sessionTime: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly commonService: CommonService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    this.loggerService = new Logger(AuthService.name);
    this.cookieName = this.configService.get<string>('REFRESH_COOKIE');
    this.testing = this.configService.get<boolean>('testing');
    this.refreshTime = this.configService.get<number>('jwt.refresh.time');
    this.accessTime = this.configService.get<number>('jwt.access.time');
    this.sessionTime = this.configService.get<number>('jwt.session.time');
  }

  //____________________ STATIC ____________________

  /**
   * Generates a random 6 char long string for two-factor auth
   */
  private static generateAccessCode(): string {
    return randomBytes(3).toString('hex').toUpperCase();
  }

  //____________________ MUTATIONS ____________________

  /**
   * Takes the register input, creates a new user in the db and asynchronously
   * sends a confirmation email
   */
  public async registerUser(input: RegisterDto): Promise<LocalMessageType> {
    const user = await this.usersService.createUser(input);
    this.sendConfirmationEmail(user);
    return new LocalMessageType('User registered successfully');
  }

  /**
   * Takes a confirmation token, confirms and updates the user
   */
  public async confirmEmail(
    res: FastifyReply,
    { confirmationToken }: ConfirmEmailDto,
  ): Promise<IAuthResult> {
    const payload = await this.jwtService.verifyToken<IEmailToken>(
      confirmationToken,
      TokenTypeEnum.CONFIRMATION,
    );
    const user = await this.usersService.getUserByPayload(payload);

    if (user.confirmed)
      throw new BadRequestException('Email already confirmed');

    user.confirmed = true;
    user.credentials.updateVersion();
    user.lastLogin = new Date();
    await this.usersService.saveUserToDb(user);

    const [accessToken, refreshToken] = await this.generateAuthTokens(user);
    this.saveRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  /**
   * Takes the login input, if two-factor auth is true: it caches a new access
   * code and asynchronously sends it by email. If false, it sends an auth type
   */
  public async loginUser(
    res: FastifyReply,
    dto: LoginDto,
  ): Promise<IAuthResult | LocalMessageType> {
    const password = dto.password;
    const email = dto.email.toLowerCase();
    const user = await this.usersService.getUserForAuth(email);

    if (!(await compare(password, user.password))) {
      await this.checkLastPassword(user.credentials, password);
    }
    if (!user.confirmed) {
      this.sendConfirmationEmail(user);
      throw new UnauthorizedException(
        'Please confirm your account. A new email has been sent',
      );
    }
    if (user.twoFactor) {
      const code = AuthService.generateAccessCode();
      await this.commonService.throwInternalError(
        this.cacheManager.set(
          `two_factor:${email}`,
          await hash(code, 5),
          this.accessTime * 1000,
        ),
      );
      this.emailService.sendAccessCode(user, code);
      return new LocalMessageType('Login confirmation code sent');
    }

    const [accessToken, refreshToken] = await this.generateAuthTokens(user);
    this.saveRefreshCookie(res, refreshToken);
    user.lastLogin = new Date();
    await this.usersService.saveUserToDb(user);

    return {
      accessToken,
    };
  }

  /**
   * Confirm Credentials
   *
   * Confirms credentials update by user
   */
  public async confirmCredentials(userId: number): Promise<LocalMessageType> {
    const user = await this.usersService.userById(userId);

    user.credentials.updatedAt = dayjs().unix();
    await this.usersService.saveUserToDb(user);

    return new LocalMessageType('Authentication credentials confirmed');
  }

  /**
   * Confirm Login
   *
   * Takes the confirmation login input, checks the access code
   * and logins the user
   */
  public async confirmLogin(
    res: FastifyReply,
    dto: ConfirmLoginDto,
  ): Promise<IAuthResult> {
    const accessCode = dto.accessCode;
    const email = dto.email.toLowerCase();
    const hashedCode = await this.commonService.throwInternalError(
      this.cacheManager.get<string>(`two_factor:${email}`),
    );

    if (!hashedCode || !(await compare(accessCode, hashedCode)))
      throw new UnauthorizedException('Access code is invalid or has expired');

    const user = await this.usersService.getUserForAuth(email);

    const [accessToken, refreshToken] = await this.generateAuthTokens(user);
    this.saveRefreshCookie(res, refreshToken);

    user.lastLogin = new Date();
    await this.usersService.saveUserToDb(user);

    return { accessToken };
  }

  /**
   * Logout User
   *
   * Removes the refresh token from the cookies
   */
  public async logoutUser(
    req: FastifyRequest,
    res: FastifyReply,
  ): Promise<LocalMessageType> {
    const token = this.getRefreshToken(req, res);
    const payload = await this.jwtService.verifyToken<IRefreshToken>(
      token,
      TokenTypeEnum.REFRESH,
    );
    await this.blacklistToken(payload.id, payload.tokenId, payload.exp);
    res.clearCookie(this.cookieName, { path: '/api/auth/refresh-access' });
    return new LocalMessageType('Logout Successfully');
  }

  /**
   * Refresh Access Token
   *
   * Takes the request and response, and generates new auth tokens
   * based on the current refresh token.
   *
   * It generates both tokens so the user can stay logged in indefinitely
   */
  public async refreshAccessToken(
    req: FastifyRequest,
    res: FastifyReply,
  ): Promise<IAuthResult> {
    const token = this.getRefreshToken(req, res);
    const { id, version } = await this.jwtService.verifyToken<IRefreshToken>(
      token,
      TokenTypeEnum.REFRESH,
    );
    const user = await this.usersService.getUncheckUserById(id);

    if (user.credentials.version !== version) {
      res.clearCookie(this.cookieName, { path: '/api/auth' });
      throw new UnauthorizedException('Token is invalid or expired');
    }

    const [accessToken, refreshToken] = await this.generateAuthTokens(user);
    this.saveRefreshCookie(res, refreshToken);

    return { accessToken };
  }

  /**
   * Send Reset Password Email
   *
   * Takes a user email and sends a reset password email
   */
  public async sendResetPasswordEmail({
    email,
  }: ResetEmailDto): Promise<LocalMessageType> {
    email = email.toLowerCase();
    const user = await this.usersService.getUncheckUser(email);

    if (user) {
      const resetToken = await this.generateAuthToken(
        { id: user.id, count: user.credentials.version },
        'resetPassword',
      );
      this.emailService.sendResetPasswordEmail(user, resetToken);
    }

    return new LocalMessageType('Password reset email sent');
  }

  /**
   * Reset Password
   *
   * Resets password given a reset password jwt token
   */
  public async resetPassword(dto: ResetPasswordDto): Promise<LocalMessageType> {
    const { password1, password2, resetToken } = dto;
    const payload = await this.jwtService.verifyToken<IEmailToken>(
      resetToken,
      TokenTypeEnum.RESET_PASSWORD,
    );

    if (password1 !== password2) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.usersService.getUserByPayload(payload);
    user.credentials.updatePassword(user.password);
    user.password = await hash(password1, 10);
    await this.usersService.saveUserToDb(user);

    return new LocalMessageType('Password reseted successfully');
  }

  /**
   * Change Two-Factor Auth
   *
   * Activates or deactivates two-factor auth
   */
  public async changeTwoFactorAuth(userId: number): Promise<LocalMessageType> {
    const user = await this.usersService.userById(userId);

    user.twoFactor = !user.twoFactor;
    await this.usersService.saveUserToDb(user);

    const status = user.twoFactor ? 'activated' : 'deactivated';
    return new LocalMessageType(
      `Two factor authentication ${status} successfully`,
    );
  }

  /**
   * Update Email
   *
   * Change current user email
   */
  public async updateEmail(
    res: FastifyReply,
    userId: number,
    { email, password }: ChangeEmailDto,
  ): Promise<IAuthResult> {
    email = email.toLowerCase();
    const user = await this.usersService.userById(userId);

    if (!(await compare(password, user.password)))
      throw new BadRequestException('Wrong password');

    if (email === user.email)
      throw new BadRequestException(
        'The new email has to differ from the old one',
      );
    user.email = email;
    user.credentials.updateVersion();
    await this.usersService.saveUserToDb(user);

    const [accessToken, refreshToken] = await this.generateAuthTokens(user);
    this.saveRefreshCookie(res, refreshToken);

    return { accessToken };
  }

  /**
   * Change current user password
   */
  public async updatePassword(
    res: FastifyReply,
    userId: number,
    { password, password1, password2 }: ChangePasswordDto,
  ): Promise<IAuthResult> {
    const user = await this.usersService.userById(userId);

    if (!(await compare(password, user.password)))
      throw new BadRequestException('Wrong password');

    if (password == password1)
      throw new BadRequestException(
        'The new password has to differ from the old one',
      );

    if (password1 !== password2)
      throw new BadRequestException('Passwords do not match');

    user.credentials.updatePassword(user.password);
    user.password = await hash(password1, 10);
    await this.usersService.saveUserToDb(user);

    const [accessToken, refreshToken] = await this.generateAuthTokens(user);
    this.saveRefreshCookie(res, refreshToken);

    return { accessToken };
  }

  /**
   * Generates a session for a given user, saves it to the sessions redis cache
   * and returns the current user with the session id
   */
  public async generateWsSession(
    accessToken: string,
  ): Promise<[number, string]> {
    const { id } = await this.jwtService.verifyToken<IAccessToken>(
      accessToken,
      TokenTypeEnum.ACCESS,
    );
    const user = await this.usersService.userById(id);
    const sessionKey = `session:${id}`;
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

    const sessionId = uuidV4();
    sessionData.sessions[sessionId] = dayjs().unix();
    await this.saveSessionData(sessionKey, sessionData);

    return [id, sessionId];
  }

  /**
   * Checks if user session is valid for websocket auth
   */
  public async refreshUserSession(wsCtx: IWsCtx): Promise<boolean> {
    const { userId, sessionId } = wsCtx;
    const sessionKey = `session:${userId}`;
    const sessionData = await this.commonService.throwInternalError(
      this.cacheManager.get<ISessionsData>(sessionKey),
    );

    if (!sessionData) return false;

    const session = sessionData.sessions[sessionId];

    if (!session) return false;

    const now = dayjs().unix();

    if (now - session > this.accessTime) {
      const user = await this.usersService.getUncheckUserById(userId);

      if (!user) return false;
      if (user.credentials.version !== sessionData.count) {
        await this.commonService.throwInternalError(
          this.cacheManager.del(sessionKey),
        );
        return false;
      }

      sessionData.sessions[sessionId] = now;
      await this.saveSessionData(sessionKey, sessionData);
    }

    return true;
  }

  //____________________ WebSocket Auth ____________________

  /**
   * Removes websocket session from cache, if it's the only one, makes the user
   * online status offline
   */
  public async closeUserSession(wsCtx: IWsCtx): Promise<void> {
    const { userId, sessionId } = wsCtx;
    const sessionKey = `session:${userId}`;
    const sessionData = await this.commonService.throwInternalError(
      this.cacheManager.get<ISessionsData>(sessionKey),
    );

    if (!sessionData.sessions[sessionId]) {
      throw new UnauthorizedException('Invalid session');
    }

    delete sessionData.sessions[sessionId];

    if (Object.keys(sessionData.sessions).length === 0) {
      await this.commonService.throwInternalError(
        this.cacheManager.del(sessionKey),
      );
      const user = await this.usersService.userById(userId);
      user.lastOnline = new Date();
      user.onlineStatus = OnlineStatusEnum.OFFLINE;
      await this.usersService.saveUserToDb(user);
      return;
    }

    await this.saveSessionData(sessionKey, sessionData);
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

  private async blacklistToken(
    userId: number,
    tokenId: string,
    exp: number,
  ): Promise<void> {
    const now = dayjs().unix();
    const ttl = (exp - now) * 1000;

    if (ttl > 0) {
      await this.commonService.throwInternalError(
        this.cacheManager.set(`blacklist:${userId}:${tokenId}`, now, ttl),
      );
    }
  }

  private getRefreshToken(req: FastifyRequest, res: FastifyReply): string {
    const token = req.cookies[this.cookieName];

    if (isUndefined(token) || isNull(token)) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const { valid, value } = res.unsignCookie(token);

    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return value;
  }

  /**
   * Sends an email for the user to confirm his account after registration
   */
  private sendConfirmationEmail(user: UserEntity) {
    this.generateAuthToken(
      { id: user.id, count: user.credentials.version },
      'confirmation',
    )
      .then((token) => {
        this.emailService.sendConfirmationEmail(user, token);
      })
      .catch(() => {
        this.loggerService.error('Error sending confirmation email');
      });
  }

  /**
   * This function takes advantage of Promise.all
   */
  private async generateAuthTokens(
    user: IUser,
    domain?: string,
    tokenId?: string,
  ): Promise<[string, string]> {
    return this.commonService.throwInternalError(
      Promise.all([
        this.jwtService.generateToken(
          user,
          TokenTypeEnum.ACCESS,
          domain,
          tokenId,
        ),
        this.jwtService.generateToken(
          user,
          TokenTypeEnum.REFRESH,
          domain,
          tokenId,
        ),
      ]),
    );
  }

  /**
   * A generic jwt generator that generates all tokens needed for auth (access,
   * refresh, confirmation & resetPassword)
   */
  private async generateAuthToken(
    payload: ITokenPayload | IAccessPayload,
    type: keyof IJwt,
  ): Promise<string> {
    const { secret, time } = this.configService.get<ISingleJwt>(`jwt.${type}`);

    return await this.commonService.throwInternalError(
      generateToken(payload, secret, time),
    );
  }

  /**
   * Saves the refresh token as a http only cookie to be used for refreshing
   * the access token
   */
  private saveRefreshCookie(res: FastifyReply, token: string): void {
    res.cookie(this.cookieName, token, {
      secure: !this.testing,
      httpOnly: true,
      signed: true,
      path: '/api/auth',
      expires: new Date(Date.now() + this.refreshTime * 1000),
    });
  }

  /**
   * Saves session data in cache
   */
  private async saveSessionData(
    userUuid: string,
    sessionData: ISessionsData,
  ): Promise<void> {
    await this.commonService.throwInternalError(
      this.cacheManager.set(userUuid, sessionData, this.sessionTime * 1000),
    );
  }
}
