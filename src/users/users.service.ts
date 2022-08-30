import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
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
import { PubSub } from 'mercurius';
import { v4 as uuidV4, v5 as uuidV5 } from 'uuid';
import { RegisterDto } from '../auth/dtos/register.dto';
import { ISessionsData } from '../auth/interfaces/sessions-data.interface';
import { ITokenPayload } from '../auth/interfaces/token-payload.interface';
import { CommonService } from '../common/common.service';
import { SearchDto } from '../common/dtos/search.dto';
import { LocalMessageType } from '../common/entities/gql/message.type';
import { getCursorType } from '../common/enums/cursor-type.enum';
import { NotificationTypeEnum } from '../common/enums/notification-type.enum';
import { getUserQueryCursor } from '../common/enums/query-cursor.enum';
import { RatioEnum } from '../common/enums/ratio.enum';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { UploaderService } from '../uploader/uploader.service';
import { OnlineStatusDto } from './dtos/online-status.dto';
import { ProfilePictureDto } from './dtos/profile-picture.dto';
import { UserEntity } from './entities/user.entity';
import { IUserNotification } from './interfaces/user-notification.interface';

@Injectable()
export class UsersService {
  private readonly wsNamespace = this.configService.get<string>('WS_UUID');
  private readonly wsAccessTime =
    this.configService.get<number>('jwt.wsAccess.time');

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: EntityRepository<UserEntity>,
    private readonly commonService: CommonService,
    private readonly uploaderService: UploaderService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  //____________________ MUTATIONS ____________________

  /**
   * Create User
   *
   * Creates a new user and saves him in db
   */
  public async createUser({
    name,
    email,
    password1,
    password2,
  }: RegisterDto): Promise<UserEntity> {
    if (password1 !== password2)
      throw new BadRequestException('Passwords do not match');

    email = email.toLowerCase();
    name = this.commonService.formatTitle(name);
    const password = await hash(password1, 10);
    let username = this.commonService.generatePointSlug(name);

    if (username.length >= 3) {
      const count = await this.usersRepository.count({
        username: { $like: `${username}%` },
      });
      if (count > 0) username += count.toString();
    } else {
      username = uuidV4();
    }

    const user = this.usersRepository.create({
      name,
      username,
      email,
      password,
    });

    await this.saveUserToDb(user, true);
    return user;
  }

  /**
   * Update Profile Picture
   *
   * Updates the current user profile picture and deletes
   * the old one if it exits
   */
  public async updateProfilePicture(
    pubsub: PubSub,
    userId: number,
    { picture }: ProfilePictureDto,
  ): Promise<UserEntity> {
    const user = await this.userById(userId);
    const toDelete = user.picture;

    user.picture = await this.uploaderService.uploadImage(
      userId,
      picture,
      RatioEnum.SQUARE,
    );

    if (toDelete) await this.uploaderService.deleteFile(toDelete);

    await this.saveUserToDb(user);
    this.publishUserNotification(pubsub, user, NotificationTypeEnum.UPDATE);
    return user;
  }

  /**
   * Update Default Status
   *
   * Updates the default online status of current user
   */
  public async updateDefaultStatus(
    pubsub: PubSub,
    userId: number,
    { defaultStatus }: OnlineStatusDto,
  ): Promise<UserEntity> {
    const user = await this.userById(userId);
    user.defaultStatus = defaultStatus;
    const userUuid = uuidV5(userId.toString(), this.wsNamespace);
    const sessionData = await this.commonService.throwInternalError(
      this.cacheManager.get<ISessionsData>(userUuid),
    );

    if (sessionData) {
      user.onlineStatus = defaultStatus;
      await this.commonService.throwInternalError(
        this.cacheManager.set<ISessionsData>(userUuid, sessionData, {
          ttl: this.wsAccessTime,
        }),
      );
      this.publishUserNotification(pubsub, user, NotificationTypeEnum.UPDATE);
    }

    await this.saveUserToDb(user);
    return user;
  }

  /**
   * Delete User
   *
   * Deletes current user account
   */
  public async deleteUser(
    userId: number,
    password: string,
  ): Promise<LocalMessageType> {
    const user = await this.userById(userId);

    if (password.length > 1 && !(await compare(password, user.password)))
      throw new BadRequestException('Wrong password!');

    try {
      await this.cacheManager.del(uuidV5(userId.toString(), this.wsNamespace));
    } catch (_) {}

    await this.commonService.removeEntity(this.usersRepository, user);
    return new LocalMessageType('Account deleted successfully');
  }

  //____________________ QUERIES ____________________

  /**
   * Get User For Auth
   *
   * Gets a user by email for auth
   */
  public async getUserForAuth(email: string): Promise<UserEntity> {
    email = email.toLowerCase();
    const user = await this.usersRepository.findOne({ email });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  /**
   * Get Uncheck User
   *
   * Gets a user by email and does not check if it exists
   */
  public async getUncheckUser(
    email: string,
  ): Promise<UserEntity | undefined | null> {
    email = email.toLowerCase();
    return this.usersRepository.findOne({ email });
  }

  /**
   * Get Uncheck User by ID
   *
   * Gets a user by id and does not check if it exists
   */
  public async getUncheckUserById(
    id: number,
  ): Promise<UserEntity | undefined | null> {
    return this.usersRepository.findOne({ id });
  }

  /**
   * Get User By Payload
   *
   * Gets user by jwt payload for auth
   */
  public async getUserByPayload({
    id,
    count,
  }: ITokenPayload): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ id });
    if (!user || user.credentials.version !== count)
      throw new UnauthorizedException('Token is invalid or has expired');
    return user;
  }

  /**
   * Get User By ID
   *
   * Gets user by id, usually the current logged-in user
   */
  public async userById(id: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ id });
    this.commonService.checkExistence('User', user);
    return user;
  }

  /**
   * User By Username
   *
   * Gets user by username, usually for the profile (if it exists)
   */
  public async userByUsername(username: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ username });
    this.commonService.checkExistence('User', user);
    return user;
  }

  /**
   * Find Users
   *
   * Search users usernames and returns paginated results
   */
  public async filterUsers({
    search,
    order,
    cursor,
    first,
    after,
  }: SearchDto): Promise<IPaginated<UserEntity>> {
    const name = 'u';

    const qb = this.usersRepository.createQueryBuilder(name).where({
      confirmed: true,
    });

    if (search) {
      qb.andWhere({
        name: {
          $ilike: this.commonService.formatSearch(search),
        },
      });
    }

    return await this.commonService.queryBuilderPagination(
      name,
      getUserQueryCursor(cursor),
      first,
      order,
      qb,
      after,
      getCursorType(cursor),
    );
  }

  //____________________ OTHER ____________________

  /**
   * Save User To Database
   *
   * Inserts or updates user in the database.
   * This method exists because saving the user has
   * to be shared with the auth service.
   */
  public async saveUserToDb(user: UserEntity, isNew = false): Promise<void> {
    await this.commonService.saveEntity(this.usersRepository, user, isNew);
  }

  private publishUserNotification(
    pubsub: PubSub,
    user: UserEntity,
    notificationType: NotificationTypeEnum,
  ) {
    pubsub.publish<IUserNotification>({
      topic: 'USER_NOTIFICATION',
      payload: {
        userNotification: this.commonService.generateNotification(
          user,
          notificationType,
          'username',
        ),
      },
    });
  }
}
