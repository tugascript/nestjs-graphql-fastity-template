import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CacheModule, CACHE_MANAGER } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { sign, verify } from 'jsonwebtoken';
import { CommonModule } from '../../common/common.module';
import { CommonService } from '../../common/common.service';
import { config, IJwt, ISingleJwt } from '../../config/config';
import { MikroOrmConfig } from '../../config/mikroorm.config';
import { validationSchema } from '../../config/validation';
import { EmailModule } from '../../email/email.module';
import { UsersModule } from '../../users/users.module';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';
import {
  IAccessPayload,
  IAccessPayloadResponse,
} from '../interfaces/access-payload.interface';
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

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(usersService).toBeDefined();
    expect(configService).toBeDefined();
    expect(commonService).toBeDefined();
    expect(cacheManager).toBeDefined();
  });
});
