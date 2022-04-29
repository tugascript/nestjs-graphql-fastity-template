import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcrypt';
import { Cache } from 'cache-manager';
import dayjs from 'dayjs';
import { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidV4, v5 as uuidV5 } from 'uuid';
import { CommonService } from '../common/common.service';
import { LocalMessageType } from '../common/gql-types/message.type';
import { IJwt, ISingleJwt } from '../config/interfaces/jwt.interface';
import { IWsCtx } from '../config/interfaces/ws-ctx.interface';
import { EmailService } from '../email/email.service';
import { UserEntity } from '../users/entities/user.entity';
import { OnlineStatusEnum } from '../users/enums/online-status.enum';
import { UsersService } from '../users/users.service';
import { ChangeEmailDto } from './dtos/change-email.dto';
import { ChangePasswordDto } from './dtos/change-password.input';
import { ConfirmEmailDto } from './dtos/confirm-email.dto';
import { ConfirmLoginDto } from './dtos/confirm-login.dto';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { ResetEmailDto } from './dtos/reset-email.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { generateToken, verifyToken } from './helpers/async-jwt';
import {
  IAccessPayload,
  IAccessPayloadResponse,
} from './interfaces/access-payload.interface';
import { IAuthResult } from './interfaces/auth-result.interface';
import { ISessionsData } from './interfaces/sessions-data.interface';
import {
  ITokenPayload,
  ITokenPayloadResponse,
} from './interfaces/token-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private readonly cookieName =
    this.configService.get<string>('REFRESH_COOKIE');
  private readonly url = this.configService.get<string>('url');
  private readonly authNamespace = this.configService.get<string>('AUTH_UUID');
  private readonly wsNamespace = this.configService.get<string>('WS_UUID');
  private readonly testing = this.configService.get<boolean>('testing');
  private readonly refreshTime =
    this.configService.get<number>('jwt.refresh.time');
  private readonly accessTime =
    this.configService.get<number>('jwt.access.time');
  private readonly sessionTime = this.configService.get<number>('sessionTime');

  //____________________ MUTATIONS ____________________

  /**
   * Register User
   *
   * Takes the register input, creates a new user in the db
   * and asyncronously sends a confirmation email
   */
  public async registerUser(input: RegisterDto): Promise<LocalMessageType> {
    const user = await this.usersService.createUser(input);
    this.sendConfirmationEmail(user);
    return new LocalMessageType('User registered successfully');
  }

  /**
   * Confirm Email
   *
   * Takes a confirmation token, confirms and updates the user
   */
  public async confirmEmail(
    res: FastifyReply,
    { confirmationToken }: ConfirmEmailDto,
  ): Promise<IAuthResult> {
    const payload = (await this.verifyAuthToken(
      confirmationToken,
      'confirmation',
    )) as ITokenPayloadResponse;
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
   * Login User
   *
   * Takes the login input, if two factor auth is true: it caches a new access code and
   * asyncronously sends it by email. If false, it sends an auth type
   */
  public async loginUser(
    res: FastifyReply,
    { email, password }: LoginDto,
  ): Promise<IAuthResult | LocalMessageType> {
    const user = await this.usersService.getUserForAuth(email);
    const currentPassword = user.password;
    const { lastPassword, updatedAt } = user.credentials;
    const now = dayjs();
    const time = dayjs.unix(updatedAt);
    const months = now.diff(time, 'month');

    if (!(await compare(password, currentPassword))) {
      // To check for passwords changes, based on facebook auth
      if (lastPassword.length > 0 && !(await compare(password, lastPassword))) {
        let message = 'You changed your password ';

        if (months > 0) {
          message += months + ' months ago.';
        } else {
          const days = now.diff(time, 'day');

          if (days > 0) {
            message += days + ' days ago.';
          } else {
            const hours = now.diff(time, 'hour');

            if (hours > 0) {
              message += hours + ' hours ago.';
            } else {
              message += 'recently.';
            }
          }
        }

        throw new UnauthorizedException(message);
      }

      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.confirmed) {
      this.sendConfirmationEmail(user);
      throw new UnauthorizedException(
        'Please confirm your account. A new email has been sent',
      );
    }

    if (user.twoFactor) {
      const code = this.generateAccessCode();

      await this.commonService.throwInternalError(
        this.cacheManager.set(
          uuidV5(email, this.authNamespace),
          await hash(code, 5),
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
      message:
        months >= 6
          ? new LocalMessageType('Please confirm your credentials')
          : undefined,
    };
  }

  /**
   * Confirm Credentials
   *
   * Confirms credentials update by user
   */
  public async confirmCredentials(userId: number): Promise<LocalMessageType> {
    const user = await this.usersService.getUserById(userId);

    user.credentials.updatedAt = dayjs().unix();
    await this.usersService.saveUserToDb(user);

    return new LocalMessageType('Authentication credentials confirmed');
  }

  /**
   * Confirm Login
   *
   * Takes the confirm login input, checks the access code
   * and logins the user
   */
  public async confirmLogin(
    res: FastifyReply,
    { email, accessCode }: ConfirmLoginDto,
  ): Promise<IAuthResult> {
    const hashedCode = await this.commonService.throwInternalError(
      this.cacheManager.get<string>(uuidV5(email, this.authNamespace)),
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
  public logoutUser(res: FastifyReply): LocalMessageType {
    res.clearCookie(this.cookieName, { path: '/api/auth/refresh-access' });
    return new LocalMessageType('Logout Successfully');
  }

  /**
   * Refresh Access Token
   *
   * Takes the request and response, and generates new auth tokens
   * based on the current refresh token.
   *
   * It generates both tokens so the user can stay logged in indefinatly
   */
  public async refreshAccessToken(
    req: FastifyRequest,
    res: FastifyReply,
  ): Promise<IAuthResult> {
    const token = req.cookies[this.cookieName];

    if (!token) throw new UnauthorizedException('Invalid refresh token');

    const { valid, value } = res.unsignCookie(token);

    if (!valid) throw new UnauthorizedException('Invalid refresh token');

    const payload = (await this.verifyAuthToken(
      value,
      'refresh',
    )) as ITokenPayloadResponse;
    const user = await this.usersService.getUncheckUserById(payload.id);

    if (user.credentials.version !== payload.count) {
      this.logoutUser(res);
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
    const user = await this.usersService.getUncheckUser(email);

    if (user) {
      const resetToken = await this.generateAuthToken(
        { id: user.id, count: user.credentials.version },
        'resetPassword',
      );
      const url = `${this.url}/reset-password/${resetToken}/`;
      this.emailService.sendPasswordResetEmail(user, url);
    }

    return new LocalMessageType('Password reset email sent');
  }

  /**
   * Reset Password
   *
   * Resets password given a reset password jwt token
   */
  public async resetPassword({
    resetToken,
    password1,
    password2,
  }: ResetPasswordDto): Promise<LocalMessageType> {
    const payload = (await this.verifyAuthToken(
      resetToken,
      'resetPassword',
    )) as ITokenPayloadResponse;

    if (password1 !== password2)
      throw new BadRequestException('Passwords do not match');

    const user = await this.usersService.getUserByPayload(payload);
    user.credentials.updatePassword(user.password);
    user.password = await hash(password1, 10);
    await this.usersService.saveUserToDb(user);

    return new LocalMessageType('Password reseted successfully');
  }

  /**
   * Change Two Factor Auth
   *
   * Activates or deactivates two factor auth
   */
  public async changeTwoFactorAuth(userId: number): Promise<LocalMessageType> {
    const user = await this.usersService.getUserById(userId);

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
    const user = await this.usersService.getUserById(userId);

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
   * Update Password
   *
   * Change current user password
   */
  public async updatePassword(
    res: FastifyReply,
    userId: number,
    { password, password1, password2 }: ChangePasswordDto,
  ): Promise<IAuthResult> {
    const user = await this.usersService.getUserById(userId);

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

  //____________________ WebSocket Auth ____________________

  /**
   * Generate Websocket Session
   *
   * Generates a session for a given user, saves it to the
   * sessions redis cache and returns the current user and
   * session id
   */
  public async generateWsSession(
    accessToken: string,
  ): Promise<[number, string]> {
    const { id } = await this.verifyAuthToken(accessToken, 'access');
    const user = await this.usersService.getUserById(id);
    const userUuid = uuidV5(user.id.toString(), this.wsNamespace);
    const count = user.credentials.version;
    let sessionData = await this.commonService.throwInternalError(
      this.cacheManager.get<ISessionsData>(userUuid),
    );

    if (!sessionData || sessionData.count != count) {
      sessionData = {
        sessions: {},
        count,
      };
      user.onlineStatus = user.defaultStatus;
    }

    const sessionId = uuidV4();
    sessionData.sessions[sessionId] = dayjs().unix();
    await this.saveSessionData(userUuid, sessionData);

    return [id, sessionId];
  }

  /**
   * Refresh User Session
   *
   * Checks if user session is valid for websocket auth
   */
  public async refreshUserSession({
    userId,
    sessionId,
  }: IWsCtx): Promise<boolean> {
    const userUuid = uuidV5(userId.toString(), this.wsNamespace);
    const sessionData = await this.commonService.throwInternalError(
      this.cacheManager.get<ISessionsData>(userUuid),
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
          this.cacheManager.del(userUuid),
        );
        return false;
      }

      sessionData.sessions[sessionId] = now;
      await this.saveSessionData(userUuid, sessionData);
    }

    return true;
  }

  /**
   * Close User Session
   *
   * Removes websocket session from cache, if its the only
   * one, makes the user online status offline
   */
  public async closeUserSession({ userId, sessionId }: IWsCtx): Promise<void> {
    const userUuid = uuidV5(userId.toString(), this.wsNamespace);
    const sessionData = await this.commonService.throwInternalError(
      this.cacheManager.get<ISessionsData>(userUuid),
    );

    if (!sessionData.sessions[sessionId])
      throw new UnauthorizedException('Invalid session');

    delete sessionData.sessions[sessionId];

    if (Object.keys(sessionData.sessions).length === 0) {
      await this.commonService.throwInternalError(
        this.cacheManager.del(userUuid),
      );
      const user = await this.usersService.getUserById(userId);
      user.lastOnline = new Date();
      user.onlineStatus = OnlineStatusEnum.OFFLINE;
      await this.usersService.saveUserToDb(user);
      return;
    }

    await this.saveSessionData(userUuid, sessionData);
  }

  //____________________ OTHER METHODS ____________________

  /**
   * Verify Auth Token
   *
   * A generic jwt verifier that verifies all token needed for auth
   */
  public async verifyAuthToken(
    token: string,
    type: keyof IJwt,
  ): Promise<ITokenPayloadResponse | IAccessPayloadResponse> {
    const secret = this.configService.get<string>(`jwt.${type}.secret`);

    try {
      return await verifyToken(token, secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      } else {
        throw new UnauthorizedException(error.message);
      }
    }
  }

  //____________________ PRIVATE METHODS ____________________

  /**
   * Send Confirmation Email
   *
   * Sends an email for the user to confirm
   * his account after registration
   */
  private async sendConfirmationEmail(user: UserEntity): Promise<string> {
    const emailToken = await this.generateAuthToken(
      { id: user.id, count: user.credentials.version },
      'confirmation',
    );
    const url = `${this.url}/confirm-email/${emailToken}/`;
    await this.emailService.sendConfirmationEmail(user, url);
    return emailToken;
  }

  /**
   * Generate Auth Tokens
   *
   * Generates an array with both the access and
   * refresh token.
   *
   * This function takes advantage of Promise.all.
   */
  private async generateAuthTokens({
    id,
    credentials,
  }: UserEntity): Promise<[string, string]> {
    return Promise.all([
      this.generateAuthToken({ id }, 'access'),
      this.generateAuthToken({ id, count: credentials.version }, 'refresh'),
    ]);
  }

  /**
   * Generate Jwt Token
   *
   * A generict jwt generator that generates all tokens needed
   * for auth (access, refresh, confirmation & resetPassword)
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
   * Generate Access Code
   *
   * Generates a 6 char long number string for two factor auth
   */
  private generateAccessCode(): string {
    const nums = '0123456789';

    let code = '';
    while (code.length < 6) {
      const i = Math.floor(Math.random() * nums.length);
      code += nums[i];
    }

    return code;
  }

  /**
   * Save Refresh Cookie
   *
   * Saves the refresh token as an http only cookie to
   * be used for refreshing the access token
   */
  private saveRefreshCookie(res: FastifyReply, token: string): void {
    res.cookie(this.cookieName, token, {
      secure: !this.testing,
      httpOnly: true,
      signed: true,
      path: '/api/auth/refresh-access',
      expires: new Date(Date.now() + this.refreshTime),
    });
  }

  /**
   * Save Session Data
   *
   * Saves session data in cache
   */
  private async saveSessionData(
    userUuid: string,
    sessionData: ISessionsData,
  ): Promise<void> {
    await this.commonService.throwInternalError(
      this.cacheManager.set<ISessionsData>(userUuid, sessionData, {
        ttl: this.sessionTime,
      }),
    );
  }
}
