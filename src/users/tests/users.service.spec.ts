import { faker } from '@faker-js/faker';
import { getRepositoryToken, MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/sqlite';
import { CacheModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { hash } from 'bcrypt';
import { RegisterDto } from '../../auth/dtos/register.dto';
import { CommonModule } from '../../common/common.module';
import { CommonService } from '../../common/common.service';
import { QueryOrderEnum } from '../../common/enums/query-order.enum';
import { LocalMessageType } from '../../common/gql-types/message.type';
import { config } from '../../config/config';
import { MikroOrmConfig } from '../../config/mikroorm.config';
import { validationSchema } from '../../config/validation';
import { UploaderModule } from '../../uploader/uploader.module';
import { UsersService } from '../../users/users.service';
import { UserEntity } from '../entities/user.entity';
import { UsersCursorEnum } from '../enums/users-cursor.enum';

const PASSWORD = 'Ab123456';

describe('UsersService', () => {
  let usersService: UsersService,
    commonService: CommonService,
    usersRepository: EntityRepository<UserEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
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
        MikroOrmModule.forFeature([UserEntity]),
        CommonModule,
        UploaderModule,
      ],
      providers: [
        UsersService,
        {
          provide: 'CommonModule',
          useClass: CommonModule,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    commonService = module.get<CommonService>(CommonService);
    usersRepository = module.get<EntityRepository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  describe('create users for pagination', () => {
    it('should create 50 users', async () => {
      const nonFlushUserCreation = async ({
        name,
        email,
        password1,
      }: RegisterDto) => {
        const user = usersRepository.create({
          name,
          email,
          username: commonService.generatePointSlug(name),
          password: await hash(password1, 10),
          confirmed: true,
        });
        return user;
      };

      const userArr: UserEntity[] = [];
      for (let i = 0; i < 50; i++) {
        userArr.push(
          await nonFlushUserCreation({
            name: faker.name.findName(),
            email: faker.internet.email(),
            password1: PASSWORD,
            password2: PASSWORD,
          }),
        );
      }
      await usersRepository.persistAndFlush(userArr);
    });
  });

  let idToDelete: number;
  describe('findUsers', () => {
    it('should get all users containing the letter a', async () => {
      const paginated = await usersService.findUsers({
        search: 'a',
        order: QueryOrderEnum.DESC,
        cursor: UsersCursorEnum.DATE,
        first: 20,
      });

      expect(paginated.edges.length).toBeDefined();
      expect(paginated.pageInfo).toBeDefined();
      expect(paginated.currentCount).toBeDefined();

      idToDelete = paginated.edges[0]?.node.id;
    });
  });

  describe('deleteUser', () => {
    it('should delete a user and return a local message', async () => {
      const message = await usersService.deleteUser(idToDelete ?? 1, PASSWORD);

      expect(message).toBeInstanceOf(LocalMessageType);
      expect(message.message).toBe('Account deleted successfully');
    });
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
    expect(commonService).toBeDefined();
    expect(usersRepository).toBeDefined();
  });
});
