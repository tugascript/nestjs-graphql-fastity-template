import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CacheModule, CACHE_MANAGER } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { compare, hash } from 'bcrypt';
import { Cache } from 'cache-manager';
import { v5, v4 } from 'uuid';
import { CommonModule } from '../../common/common.module';
import { CommonService } from '../../common/common.service';
import { LocalMessageType } from '../../common/gql-types/message.type';
import { config } from '../../config/config';
import { IJwt, ISingleJwt } from '../../config/interfaces/jwt.interface';
import { MikroOrmConfig } from '../../config/mikroorm.config';
import { validationSchema } from '../../config/validation';
import { EmailModule } from '../../email/email.module';
import { UsersModule } from '../../users/users.module';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';
import { generateToken, verifyToken } from '../helpers/async-jwt';
import {
  IAccessPayload,
  IAccessPayloadResponse,
} from '../interfaces/access-payload.interface';
import { IAuthResult } from '../interfaces/auth-result.interface';
import {
  ITokenPayload,
  ITokenPayloadResponse,
} from '../interfaces/token-payload.interface';
import { faker } from '@faker-js/faker';
import { ISessionsData } from '../interfaces/sessions-data.interface';
import dayjs from 'dayjs';

class ResponseMock {
  public cookies = '';
  public options: any;

  public cookie(name: string, token: string, options?: any) {
    this.cookies = `${name}=${token}`;
    if (options) this.options = options;
  }

  public clearCookie(name: string) {
    if (this.cookies.split('=')[0] === name) {
      this.cookies = '';
    }
  }
}

const NAME = faker.name.findName();
const EMAIL = faker.internet.email();
const NEW_EMAIL = faker.internet.email();
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

    return await commonService.throwInternalError(
      generateToken(payload, secret, time),
    );
  };

  const verifyAuthToken = async (
    token: string,
    type: keyof IJwt,
  ): Promise<ITokenPayloadResponse | IAccessPayloadResponse> => {
    const secret = configService.get<string>(`jwt.${type}.secret`);

    try {
      return await verifyToken(token, secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      } else {
        throw new Error(error.message);
      }
    }
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

  let userId: number;
  describe('Sign Up', () => {
    let confirmationToken: string;

    it('registerUser', async () => {
      await expect(
        authService.registerUser({
          name: NAME,
          email: EMAIL,
          password1: PASSWORD,
          password2: NEW_PASSWORD,
        }),
      ).rejects.toThrowError('Passwords do not match');

      jest
        .spyOn(authService, 'registerUser')
        .mockImplementationOnce(async (input) => {
          const { id, credentials } = await usersService.createUser(input);
          confirmationToken = await generateAuthToken(
            {
              id,
              count: credentials.version,
            },
            'confirmation',
          );
          userId = id;
          return new LocalMessageType('User registered successfully');
        });

      const message = await authService.registerUser({
        name: NAME,
        email: EMAIL,
        password1: PASSWORD,
        password2: PASSWORD,
      });
      expect(message).toBeInstanceOf(LocalMessageType);
      expect(message.message).toBe('User registered successfully');
      const { id } = await verifyAuthToken(confirmationToken, 'confirmation');
      expect(id).toBe(userId);
    });

    it('confirmEmail', async () => {
      const auth = await authService.confirmEmail(response as any, {
        confirmationToken,
      });
      expect(auth.accessToken).toBeDefined();
      const { id } = await verifyAuthToken(auth.accessToken, 'access');
      expect(userId).toBe(id);
    });
  });

  describe('Sign In', () => {
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
      })) as IAuthResult;

      expect(auth.accessToken).toBeDefined();
      expect(auth.message).toBeUndefined();
      const { id } = await verifyAuthToken(auth.accessToken, 'access');
      expect(userId).toBe(id);
    });

    it('loginUser w/ two factor', async () => {
      const message1 = await authService.changeTwoFactorAuth(userId);
      expect(message1).toBeInstanceOf(LocalMessageType);
      expect(message1.message).toBe(
        'Two factor authentication activated successfully',
      );
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
      expect((message2 as unknown as IAuthResult).accessToken).toBeUndefined();
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
      expect(auth2.accessToken).toBeDefined();

      const { id } = await verifyAuthToken(auth2.accessToken, 'access');
      expect(userId).toBe(id);
    });
  });

  describe('Password Reseting', () => {
    let resetToken: string;
    it('sendResetPasswordEmail && resetPassword', async () => {
      let user = await usersService.getUncheckUser(NEW_EMAIL);
      expect(user).toBeNull();
      const message1 = await authService.sendResetPasswordEmail({
        email: NEW_EMAIL,
      });
      expect(message1).toBeInstanceOf(LocalMessageType);
      expect(message1.message).toBe('Password reset email sent');

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

      const message2 = await authService.sendResetPasswordEmail({
        email: EMAIL,
      });
      expect(message2).toBeInstanceOf(LocalMessageType);
      expect(message2.message).toBe(resetToken);

      user = await usersService.getUserById(userId);
      const count = user.credentials.version;
      await expect(
        authService.resetPassword({
          resetToken: 'asdadasd',
          password1: NEW_PASSWORD,
          password2: NEW_PASSWORD,
        }),
      ).rejects.toThrowError();
      await expect(
        authService.resetPassword({
          resetToken,
          password1: PASSWORD,
          password2: NEW_PASSWORD,
        }),
      ).rejects.toThrowError();

      const message = await authService.resetPassword({
        resetToken,
        password1: NEW_PASSWORD,
        password2: NEW_PASSWORD,
      });
      expect(message).toBeInstanceOf(LocalMessageType);
      expect(message.message).toBe('Password reseted successfully');

      const { id } = await verifyAuthToken(resetToken, 'resetPassword');
      user = await usersService.getUserById(id);
      expect(user.credentials.version).toBeGreaterThan(count);
    });
  });

  describe('Update Auth Credentials', () => {
    it('updatePassword', async () => {
      let user = await usersService.getUserById(userId);
      const count = user.credentials.version;

      await expect(
        authService.updatePassword(response as any, userId, {
          password: PASSWORD,
          password1: NEW_PASSWORD,
          password2: NEW_PASSWORD,
        }),
      ).rejects.toThrowError('Wrong password');
      await expect(
        authService.updatePassword(response as any, userId, {
          password: NEW_PASSWORD,
          password1: NEW_PASSWORD,
          password2: NEW_PASSWORD,
        }),
      ).rejects.toThrowError('The new password has to differ from the old one');
      await expect(
        authService.updatePassword(response as any, userId, {
          password: NEW_PASSWORD,
          password1: PASSWORD,
          password2: NEW_PASSWORD,
        }),
      ).rejects.toThrowError('Passwords do not match');

      const auth = await authService.updatePassword(response as any, userId, {
        password: NEW_PASSWORD,
        password1: PASSWORD,
        password2: PASSWORD,
      });
      expect(auth.accessToken).toBeDefined();

      const { id } = await verifyAuthToken(auth.accessToken, 'access');
      user = await usersService.getUserById(id);
      expect(user.credentials.version).toBeGreaterThan(count);
    });

    it('updateEmail', async () => {
      let user = await usersService.getUserById(userId);
      const count = user.credentials.version;
      await expect(
        authService.updateEmail(response as any, userId, {
          email: NEW_EMAIL,
          password: NEW_PASSWORD,
        }),
      ).rejects.toThrowError('Wrong password');
      await expect(
        authService.updateEmail(response as any, userId, {
          email: EMAIL,
          password: PASSWORD,
        }),
      ).rejects.toThrowError('The new email has to differ from the old one');

      const auth = await authService.updateEmail(response as any, userId, {
        email: NEW_EMAIL,
        password: PASSWORD,
      });

      const { id } = await verifyAuthToken(auth.accessToken, 'access');
      user = await usersService.getUserById(id);
      expect(user.credentials.version).toBeGreaterThan(count);
    });

    describe('WS Auth', () => {
      it('generateWsSession', async () => {
        await expect(
          authService.generateWsSession('asdasd'),
        ).rejects.toThrowError();

        const token = await generateAuthToken({ id: userId }, 'access');
        const [id, sessionId] = await authService.generateWsSession(token);

        expect(id).toBe(userId);
        expect(sessionId).toBeDefined();
      });

      it('refreshUserSession', async () => {
        jest
          .spyOn(authService, 'generateWsSession')
          .mockImplementationOnce(async (accessToken) => {
            const { id } = await verifyAuthToken(accessToken, 'access');
            const user = await usersService.getUserById(id);
            const userUuid = v5(
              user.id.toString(),
              configService.get<string>('WS_UUID'),
            );
            const count = user.credentials.version;
            let sessionData = await commonService.throwInternalError(
              cacheManager.get<ISessionsData>(userUuid),
            );

            if (!sessionData || sessionData.count != count) {
              sessionData = {
                sessions: {},
                count,
              };
              user.onlineStatus = user.defaultStatus;
            }

            const sessionId = v4();
            sessionData.sessions[sessionId] = dayjs()
              .subtract(
                configService.get<number>('jwt.access.time') + 1,
                'second',
              )
              .unix();
            await commonService.throwInternalError(
              cacheManager.set<ISessionsData>(userUuid, sessionData, {
                ttl: configService.get<number>('sessionTime'),
              }),
            );

            return [id, sessionId];
          });

        const token = await generateAuthToken({ id: userId }, 'access');
        const [id, sessionId] = await authService.generateWsSession(token);

        expect(id).toBe(userId);
        expect(sessionId).toBeDefined();
        expect(
          await authService.refreshUserSession({ userId, sessionId }),
        ).toBe(true);

        await authService.updateEmail(response as any, userId, {
          email: EMAIL,
          password: PASSWORD,
        });

        setTimeout(
          async () =>
            expect(
              await authService.refreshUserSession({ userId, sessionId }),
            ).toBe(false),
          150,
        );
      });

      it('closeUserSession', async () => {
        const token = await generateAuthToken({ id: userId }, 'access');
        const [id, sessionId] = await authService.generateWsSession(token);
        expect(id).toBe(userId);
        expect(sessionId).toBeDefined();

        const [id2, sessionId2] = await authService.generateWsSession(token);
        expect(id2).toBe(userId);
        expect(sessionId2).toBeDefined();

        await authService.closeUserSession({ userId, sessionId });
        const userUuid = v5(
          userId.toString(),
          configService.get<string>('WS_UUID'),
        );

        expect(await cacheManager.get(userUuid)).toBeDefined();

        await authService.closeUserSession({ userId, sessionId: sessionId2 });
        expect(await cacheManager.get(userUuid)).toBeUndefined();
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
});
