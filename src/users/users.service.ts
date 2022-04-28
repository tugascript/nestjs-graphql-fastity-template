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
import { v4 as uuidV4, v5 as uuidV5 } from 'uuid';
import { RegisterDto } from '../auth/dtos/register.dto';
import { ISessionsData } from '../auth/interfaces/sessions-data.interface';
import { ITokenPayload } from '../auth/interfaces/token-payload.interface';
import { CommonService } from '../common/common.service';
import { LocalMessageType } from '../common/gql-types/message.type';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { tLikeOperator } from '../config/interfaces/jwt.interface';
import { UploaderService } from '../uploader/uploader.service';
import { GetUsersDto } from './dtos/get-users.dto';
import { OnlineStatusDto } from './dtos/online-status.dto';
import { ProfilePictureDto } from './dtos/profile-picture.dto';
import { UserEntity } from './entities/user.entity';
import { getUserCursor } from './enums/users-cursor.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: EntityRepository<UserEntity>,
    private readonly commonService: CommonService,
    private readonly uploaderService: UploaderService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private readonly likeOperator =
    this.configService.get<tLikeOperator>('likeOperator');
  private readonly wsNamespace = this.configService.get<string>('WS_UUID');
  private readonly wsAccessTime =
    this.configService.get<number>('jwt.wsAccess.time');
  private readonly cookieName =
    this.configService.get<string>('REFRESH_COOKIE');

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
    userId: number,
    { picture }: ProfilePictureDto,
  ): Promise<UserEntity> {
    const user = await this.getUserById(userId);
    const toDelete = user.picture;

    user.picture = await this.uploaderService.uploadImage(userId, picture, 1);

    if (toDelete) await this.uploaderService.deleteFile(toDelete);

    await this.saveUserToDb(user);
    return user;
  }

  /**
   * Update Default Status
   *
   * Updates the defualt online status of current user
   */
  public async updateDefaultStatus(
    userId: number,
    { defaultStatus }: OnlineStatusDto,
  ): Promise<LocalMessageType> {
    const user = await this.getUserById(userId);
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
    }

    await this.saveUserToDb(user);
    return new LocalMessageType('Default status changed successfully');
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
    const user = await this.getUserById(userId);

    if (password.length > 1 && !(await compare(password, user.password)))
      throw new BadRequestException('Wrong password!');

    try {
      await this.cacheManager.del(uuidV5(userId.toString(), this.wsNamespace));
    } catch (_) {}

    await this.commonService.throwInternalError(
      this.usersRepository.removeAndFlush(user),
    );

    return new LocalMessageType('Account deleted successfully');
  }

  //____________________ QUERIES ____________________

  /**
   * Get User For Auth
   *
   * Gets a user by email for auth
   */
  public async getUserForAuth(email: string): Promise<UserEntity> {
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
    const user = await this.usersRepository.findOne({ email });
    return user;
  }

  /**
   * Get Uncheck User by ID
   *
   * Gets a user by id and does not check if it exists
   */
  public async getUncheckUserById(
    id: number,
  ): Promise<UserEntity | undefined | null> {
    const user = await this.usersRepository.findOne({ id });
    return user;
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
   * Get User By Id
   *
   * Gets user by id, usually the current logged in user
   */
  public async getUserById(id: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ id });
    this.commonService.checkExistence('User', user);
    return user;
  }

  /**
   * Get User By Username
   *
   * Gets user by username, usually for the profile (if it exists)
   */
  public async getUserByUsername(username: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ username });
    this.commonService.checkExistence('User', user);
    return user;
  }

  /**
   * Find Users
   *
   * Search users usernames and returns paginated results
   */
  public async findUsers({
    search,
    order,
    cursor,
    first,
    after,
  }: GetUsersDto): Promise<IPaginated<UserEntity>> {
    const name = 'u';

    const qb = this.usersRepository.createQueryBuilder(name).where({
      confirmed: true,
    });

    if (search) {
      qb.andWhere({
        name: {
          [this.likeOperator]: this.commonService.formatSearch(search),
        },
      });
    }

    return await this.commonService.queryBuilderPagination(
      name,
      getUserCursor(cursor),
      first,
      order,
      qb,
      after,
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
    await this.commonService.validateEntity(user);

    if (isNew) this.usersRepository.persist(user);

    await this.commonService.throwDuplicateError(
      this.usersRepository.flush(),
      'Email already exists',
    );
  }
}
