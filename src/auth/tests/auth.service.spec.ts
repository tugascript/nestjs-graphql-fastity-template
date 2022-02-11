import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CacheModule, CACHE_MANAGER } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { compare, hash } from 'bcrypt';
import { Cache } from 'cache-manager';
import * as dayjs from 'dayjs';
import { sign, verify } from 'jsonwebtoken';
import { v5 } from 'uuid';
import { CommonModule } from '../../common/common.module';
import { CommonService } from '../../common/common.service';
import { LocalMessageType } from '../../common/gql-types/message.type';
import { config, IJwt, ISingleJwt } from '../../config/config';
import { MikroOrmConfig } from '../../config/mikroorm.config';
import { validationSchema } from '../../config/validation';
import { EmailModule } from '../../email/email.module';
import { CredentialsEmbeddable } from '../../users/embeddables/credentials.embeddable';
import { OnlineStatusEnum } from '../../users/enums/online-status.enum';
import { UsersModule } from '../../users/users.module';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';
import { AuthType } from '../gql-types/auth.type';
import {
  IAccessPayload,
  IAccessPayloadResponse,
} from '../interfaces/access-payload.interface';
import { ISessionData } from '../interfaces/session-data.interface';
import {
  ITokenPayload,
  ITokenPayloadResponse,
} from '../interfaces/token-payload.interface';
import { ResponseMock } from './response.mock.spec';

const EMAIL = 'johndoe@yahoo.com';
const NEW_EMAIL = 'johndoethesecond@yahoo.com';
const PASSWORD = 'Ab123456';
const NEW_PASSWORD = 'Ab1234567';
describe('AuthService', () => {
  let authService: AuthService,
    usersService: UsersService,
    configService: ConfigService,
    commonService: CommonService,
    cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        UsersModule,
        EmailModule,
        ConfigModule.forRoot({
          isGlobal: true,
          validationSchema,
          load: [config],
        }),
        CacheModule.register({
          isGlobal: true,
          ttl: parseInt(process.env.REDIS_CACHE_TTL, 10),
        }),
        MikroOrmModule.forRootAsync({
          imports: [ConfigModule],
          useClass: MikroOrmConfig,
        }),
        CommonModule,
      ],
      providers: [
        AuthService,
        {
          provide: 'CommonModule',
          useClass: CommonModule,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    configService = module.get<ConfigService>(ConfigService);
    commonService = module.get<CommonService>(CommonService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  // Response Mock
  const response = new ResponseMock();

  //____________________ Private Methods ____________________

  const generateAuthToken = async (
    payload: ITokenPayload | IAccessPayload,
    type: keyof IJwt,
  ): Promise<string> => {
    const { secret, time } = configService.get<ISingleJwt>(`jwt.${type}`);

    return new Promise((resolve) => {
      sign(payload, secret, { expiresIn: time }, (error, token) => {
        if (error) {
          throw new Error('Something went wrong');
        }
        resolve(token);
      });
    });
  };

  const verifyAuthToken = async (
    token: string,
    type: keyof IJwt,
  ): Promise<ITokenPayloadResponse | IAccessPayloadResponse> => {
    const secret = configService.get<string>(`jwt.${type}.secret`);

    return await new Promise((resolve) => {
      verify(token, secret, (error, payload: ITokenPayloadResponse) => {
        if (error) {
          if (error.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
          } else {
            throw new Error(error.message);
          }
        }

        resolve(payload);
      });
    });
  };

  const generateAccessCode = (): string => {
    const nums = '0123456789';

    let code = '';
    while (code.length < 6) {
      const i = Math.floor(Math.random() * nums.length);
      code += nums[i];
    }

    return code;
  };

  let sharedId: number;
  describe('HTTP AUTH', () => {
    let userId: number;
    let token: string;
    it('registerUser', async () => {
      await expect(
        authService.registerUser({
          email: EMAIL,
          name: 'John Doe',
          password1: PASSWORD,
          password2: NEW_PASSWORD,
        }),
      ).rejects.toThrowError();

      jest
        .spyOn(authService, 'registerUser')
        .mockImplementationOnce(async (input) => {
          const { id, credentials } = await usersService.createUser(input);
          token = await generateAuthToken(
            { id, count: credentials.version },
            'confirmation',
          );
          userId = id;
          return new LocalMessageType(token);
        });

      const message = await authService.registerUser({
        email: EMAIL,
        name: 'John Doe',
        password1: PASSWORD,
        password2: PASSWORD,
      });

      expect(message).toBeInstanceOf(LocalMessageType);

      const { id } = await verifyAuthToken(message.message, 'confirmation');
      expect(id).toBe(userId);

      const user = await usersService.getUserById(userId);
      expect(user).toBeDefined();
      expect(user.id).toBe(userId);
    });

    it('confirmEmail', async () => {
      const auth = await authService.confirmEmail(response as any, {
        confirmationToken: token,
      });

      expect(auth).toBeInstanceOf(AuthType);
      expect(auth.user.id).toBe(userId);
      expect(auth.user.credentials.version).toBe(1);

      const { id } = await verifyAuthToken(auth.accessToken, 'access');
      expect(auth.user.id).toBe(id);
    });

    it('loginUser w/o two factor', async () => {
      await expect(
        authService.loginUser(response as any, {
          email: EMAIL,
          password: NEW_PASSWORD,
        }),
      ).rejects.toThrowError();
      await expect(
        authService.loginUser(response as any, {
          email: NEW_EMAIL,
          password: PASSWORD,
        }),
      ).rejects.toThrowError();

      const auth = (await authService.loginUser(response as any, {
        email: EMAIL,
        password: PASSWORD,
      })) as AuthType;

      expect(auth).toBeInstanceOf(AuthType);

      const { id } = await verifyAuthToken(auth.accessToken, 'access');
      expect(auth.user.id).toBe(id);
    });

    it('loginUser w/ two factor', async () => {
      const auth = (await authService.loginUser(response as any, {
        email: EMAIL,
        password: PASSWORD,
      })) as AuthType;
      expect(auth.user.twoFactor).toBe(false);
      const userId = auth.user.id;

      const message1 = await authService.changeTwoFactorAuth(userId, true);
      expect(message1).toBeInstanceOf(LocalMessageType);

      const { twoFactor } = await usersService.getUserById(userId);
      expect(twoFactor).toBe(true);

      jest
        .spyOn(authService, 'loginUser')
        .mockImplementationOnce(async (_, { email, password }) => {
          const user = await usersService.getUserForAuth(email);

          if (!(await compare(password, user.password)))
            throw new Error('Invalid credentials');

          if (user.twoFactor) {
            const code = generateAccessCode();

            await commonService.throwInternalError(
              cacheManager.set(
                v5(email, configService.get<string>('AUTH_UUID')),
                await hash(code, 5),
              ),
            );

            return new LocalMessageType(code);
          }
        });

      const message2 = (await authService.loginUser(response as any, {
        email: EMAIL,
        password: PASSWORD,
      })) as LocalMessageType;
      expect(message2).toBeInstanceOf(LocalMessageType);

      await expect(
        authService.confirmLogin(response as any, {
          email: EMAIL,
          accessCode: '000000',
        }),
      ).rejects.toThrowError();

      const auth2 = await authService.confirmLogin(response as any, {
        email: EMAIL,
        accessCode: message2.message,
      });
      expect(auth2).toBeInstanceOf(AuthType);

      const { id } = await verifyAuthToken(auth2.accessToken, 'access');
      expect(auth2.user.id).toBe(id);
    });

    let resetToken: string;
    it('sendResetPasswordEmail', async () => {
      jest
        .spyOn(authService, 'sendResetPasswordEmail')
        .mockImplementation(async ({ email }) => {
          const user = await usersService.getUncheckUser(email);

          if (user) {
            resetToken = await generateAuthToken(
              { id: user.id, count: user.credentials.version },
              'resetPassword',
            );
            return new LocalMessageType(resetToken);
          }

          return new LocalMessageType('Password reset email sent');
        });

      const message1 = await authService.sendResetPasswordEmail({
        email: NEW_EMAIL,
      });
      expect(message1).toBeInstanceOf(LocalMessageType);
      expect(message1.message).toBe('Password reset email sent');

      const message2 = await authService.sendResetPasswordEmail({
        email: EMAIL,
      });
      expect(message2).toBeInstanceOf(LocalMessageType);
      expect(message2.message).toBe(resetToken);
    });

    it('resetPassword', async () => {
      await expect(
        authService.resetPassword({
          resetToken: 'asdavaasd',
          passwords: { password1: 'a', password2: 'a' },
        }),
      ).rejects.toThrowError();

      await expect(
        authService.resetPassword({
          resetToken,
          passwords: { password1: PASSWORD, password2: NEW_PASSWORD },
        }),
      ).rejects.toThrowError();

      const message = await authService.resetPassword({
        resetToken,
        passwords: { password1: NEW_PASSWORD, password2: NEW_PASSWORD },
      });
      expect(message).toBeInstanceOf(LocalMessageType);
      expect(message.message).toBe('Password reseted successfully');

      const { id } = await verifyAuthToken(resetToken, 'resetPassword');
      sharedId = id;
      const user = await usersService.getUserById(id);
      expect(user.credentials.version).toBe(2);
      expect(await compare(NEW_PASSWORD, user.password)).toBe(true);
    });

    it('test credentials versioning', async () => {
      const email = 'john@doe.com';
      const newUser = await usersService.createUser({
        email,
        name: 'John Doe',
        password1: PASSWORD,
        password2: PASSWORD,
      });

      const lastPassword = await hash(NEW_PASSWORD, 10);
      const today = dayjs();

      newUser.credentials = new CredentialsEmbeddable({
        version: 1,
        lastPassword,
        updatedAt: today.subtract(3, 'month').unix(),
      });
      newUser.confirmed = true;
      await usersService.saveUserToDb(newUser);

      await expect(
        authService.loginUser(response as any, {
          email,
          password: NEW_PASSWORD,
        }),
      ).rejects.toThrowError('You changed your password 3 months ago.');

      newUser.credentials = new CredentialsEmbeddable({
        version: 1,
        lastPassword,
        updatedAt: today.subtract(2, 'day').unix(),
      });
      await usersService.saveUserToDb(newUser);
      await expect(
        authService.loginUser(response as any, {
          email,
          password: NEW_PASSWORD,
        }),
      ).rejects.toThrowError('You changed your password 2 days ago.');

      newUser.credentials = new CredentialsEmbeddable({
        version: 1,
        lastPassword,
        updatedAt: today.subtract(5, 'hour').unix(),
      });
      await usersService.saveUserToDb(newUser);
      await expect(
        authService.loginUser(response as any, {
          email,
          password: NEW_PASSWORD,
        }),
      ).rejects.toThrowError('You changed your password 5 hours ago.');

      newUser.credentials = new CredentialsEmbeddable({
        version: 1,
        lastPassword,
        updatedAt: today.subtract(30, 'minute').unix(),
      });
      await usersService.saveUserToDb(newUser);
      await expect(
        authService.loginUser(response as any, {
          email,
          password: NEW_PASSWORD,
        }),
      ).rejects.toThrowError('You changed your password recently.');

      newUser.credentials = new CredentialsEmbeddable({
        version: 1,
        lastPassword,
        updatedAt: today.subtract(6, 'month').unix(),
      });
      await usersService.saveUserToDb(newUser);
      const auth = (await authService.loginUser(response as any, {
        email,
        password: PASSWORD,
      })) as AuthType;

      expect(auth.message).toBeDefined();
      expect(auth.message.message).toBe('Please confirm your credentials');

      const message = await authService.confirmCredentials(auth.user.id);
      expect(message.message).toBe('Authentication credentials confirmed');

      const newAuth = (await authService.loginUser(response as any, {
        email,
        password: PASSWORD,
      })) as AuthType;

      expect(newAuth.message).toBeUndefined();
    });
  });

  describe('WS AUTH', () => {
    it('generateWsAccessToken & refreshUserSession & closeUserSession', async () => {
      const { id, credentials } = await usersService.getUserById(sharedId);
      const accessToken = await generateAuthToken({ id }, 'access');
      const refreshToken = await generateAuthToken(
        { id, count: credentials.version },
        'refresh',
      );

      const userUuid = v5(id.toString(), configService.get<string>('WS_UUID'));

      expect(await cacheManager.get(userUuid)).toBeUndefined();

      const wsAccessToken = await authService.generateWsAccessToken(
        accessToken,
        refreshToken,
      );
      const { sessionId } = (await verifyAuthToken(
        wsAccessToken,
        'wsAccess',
      )) as IAccessPayloadResponse;

      expect(sessionId).toBeDefined();

      const sessionData = await cacheManager.get<ISessionData>(userUuid);
      expect(sessionData).toBeDefined();
      expect(sessionData.count).toBe(2);
      expect(sessionData.status).toBe(OnlineStatusEnum.ONLINE);
      expect(sessionData.sessions[sessionId]).toBeDefined();
      expect(Object.keys(sessionData.sessions).length).toBe(1);

      expect(
        await authService.refreshUserSession(id, sessionId),
      ).toBeUndefined();

      const wsAccessToken2 = await authService.generateWsAccessToken(
        accessToken,
        refreshToken,
      );
      const { sessionId: sessionId2 } = (await verifyAuthToken(
        wsAccessToken2,
        'wsAccess',
      )) as IAccessPayloadResponse;
      const sessionData2 = await cacheManager.get<ISessionData>(userUuid);
      expect(sessionData2).toBeDefined();
      expect(sessionData2.count).toBe(2);
      expect(sessionData2.status).toBe(OnlineStatusEnum.ONLINE);
      expect(sessionData2.sessions[sessionId]).toBeDefined();
      expect(sessionData2.sessions[sessionId2]).toBeDefined();
      expect(Object.keys(sessionData2.sessions).length).toBe(2);

      expect(await authService.closeUserSession(wsAccessToken)).toBeUndefined();

      const sessionData3 = await cacheManager.get<ISessionData>(userUuid);
      expect(sessionData3).toBeDefined();
      expect(sessionData3.count).toBe(2);
      expect(sessionData3.status).toBe(OnlineStatusEnum.ONLINE);
      expect(sessionData3.sessions[sessionId]).toBeUndefined();
      expect(sessionData3.sessions[sessionId2]).toBeDefined();
      expect(Object.keys(sessionData3.sessions).length).toBe(1);

      expect(
        await authService.closeUserSession(wsAccessToken2),
      ).toBeUndefined();
      expect(await cacheManager.get<ISessionData>(userUuid)).toBeUndefined();
    });
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(usersService).toBeDefined();
    expect(configService).toBeDefined();
    expect(commonService).toBeDefined();
    expect(cacheManager).toBeDefined();
  });
});
