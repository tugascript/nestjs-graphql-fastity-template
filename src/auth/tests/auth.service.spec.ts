import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CacheModule, CACHE_MANAGER } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { compare, hash } from 'bcrypt';
import { Cache } from 'cache-manager';
import { v5 } from 'uuid';
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
import { ResponseMock } from './response.mock.spec';

const NAME = 'John Doe';
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

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(usersService).toBeDefined();
    expect(configService).toBeDefined();
    expect(commonService).toBeDefined();
    expect(cacheManager).toBeDefined();
  });
});
