/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  LoggerService,
  UnauthorizedException,
} from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { Cache } from 'cache-manager';
import { ISessionsData } from '../auth/interfaces/session-data.interface';
import { CommonService } from '../common/common.service';
import { SearchDto } from '../common/dtos/search.dto';
import { CursorTypeEnum } from '../common/enums/cursor-type.enum';
import { QueryOrderEnum } from '../common/enums/query-order.enum';
import { RatioEnum } from '../common/enums/ratio.enum';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { isNull, isUndefined } from '../config/utils/validation.util';
import { PictureDto } from '../uploader/dtos/picture.dto';
import { UploaderService } from '../uploader/uploader.service';
import { UpdateEmailDto } from './dtos/update-email.dto';
import { CredentialsEmbeddable } from './embeddables/credentials.embeddable';
import { OAuthProviderEntity } from './entities/oauth-provider.entity';
import { UserEntity } from './entities/user.entity';
import { OAuthProvidersEnum } from './enums/oauth-providers.enum';
import { OnlineStatusEnum } from './enums/online-status.enum';
import { IUser } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  private readonly queryName = 'u';
  private readonly loggerService: LoggerService;

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: EntityRepository<UserEntity>,
    @InjectRepository(OAuthProviderEntity)
    private readonly oauthProvidersRepository: EntityRepository<OAuthProviderEntity>,
    private readonly uploaderService: UploaderService,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {
    this.loggerService = new Logger(UsersService.name);
  }

  public async create(
    provider: OAuthProvidersEnum,
    email: string,
    name: string,
    password?: string,
  ): Promise<UserEntity> {
    const isConfirmed = provider !== OAuthProvidersEnum.LOCAL;
    const formattedEmail = email.toLowerCase();
    await this.checkEmailUniqueness(formattedEmail);
    const formattedName = this.commonService.formatTitle(name);
    const user = this.usersRepository.create({
      email: formattedEmail,
      name: formattedName,
      username: await this.generateUsername(formattedName),
      password: isUndefined(password) ? 'UNSET' : await hash(password, 10),
      confirmed: isConfirmed,
      credentials: new CredentialsEmbeddable(isConfirmed),
    });
    await this.commonService.saveEntity(this.usersRepository, user, true);
    await this.createOAuthProvider(provider, user.id);
    return user;
  }

  public async findOrCreate(
    provider: OAuthProvidersEnum,
    email: string,
    name: string,
  ): Promise<UserEntity> {
    const formattedEmail = email.toLowerCase();
    const user = await this.usersRepository.findOne(
      {
        email: formattedEmail,
      },
      {
        populate: ['oauthProviders'],
      },
    );

    if (isUndefined(user) || isNull(user)) {
      return this.create(provider, email, name);
    }
    if (
      isUndefined(
        user.oauthProviders.getItems().find((p) => p.provider === provider),
      )
    ) {
      await this.createOAuthProvider(provider, user.id);
    }

    return user;
  }

  public async findOneById(id: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ id });
    this.commonService.checkEntityExistence(user, 'User');
    return user;
  }

  public async findOneByUsername(
    username: string,
    forAuth = false,
  ): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      username: username.toLowerCase(),
    });

    if (forAuth) {
      this.throwUnauthorizedException(user);
    } else {
      this.commonService.checkEntityExistence(user, 'User');
    }

    return user;
  }

  public async findOneByEmail(email: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      email: email.toLowerCase(),
    });
    this.throwUnauthorizedException(user);
    return user;
  }

  // necessary for password reset
  public async uncheckedUserByEmail(email: string): Promise<UserEntity> {
    return this.usersRepository.findOne({
      email: email.toLowerCase(),
    });
  }

  public async findOneByCredentials(
    id: number,
    version: number,
  ): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ id });
    this.throwUnauthorizedException(user);

    if (user.credentials.version !== version) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  public async confirmEmail(
    userId: number,
    version: number,
  ): Promise<UserEntity> {
    const user = await this.findOneByCredentials(userId, version);

    if (user.confirmed) {
      throw new BadRequestException('Email already confirmed');
    }

    user.confirmed = true;
    user.credentials.updateVersion();
    await this.commonService.saveEntity(this.usersRepository, user);
    return user;
  }

  public async updatePassword(
    userId: number,
    password: string,
    newPassword: string,
  ): Promise<UserEntity> {
    const user = await this.findOneById(userId);

    if (!(await compare(password, user.password))) {
      throw new BadRequestException('Wrong password');
    }
    if (await compare(newPassword, user.password)) {
      throw new BadRequestException('New password must be different');
    }

    user.credentials.updatePassword(user.password);
    user.password = await hash(newPassword, 10);
    await this.commonService.saveEntity(this.usersRepository, user);
    return user;
  }

  public async resetPassword(
    userId: number,
    version: number,
    password: string,
  ): Promise<UserEntity> {
    const user = await this.findOneByCredentials(userId, version);
    user.credentials.updatePassword(user.password);
    user.password = await hash(password, 10);
    await this.commonService.saveEntity(this.usersRepository, user);
    return user;
  }

  public async updateEmail(
    userId: number,
    updateEmailDto: UpdateEmailDto,
  ): Promise<UserEntity> {
    const user = await this.findOneById(userId);
    const { email, password } = updateEmailDto;

    if (!(await compare(password, user.password))) {
      throw new BadRequestException('Wrong password');
    }

    const formattedEmail = email.toLowerCase();

    if (user.email === formattedEmail) {
      throw new BadRequestException('Email should be different');
    }

    await this.checkEmailUniqueness(formattedEmail);
    user.email = formattedEmail;
    await this.commonService.saveEntity(this.usersRepository, user);
    return user;
  }

  public async delete(userId: number, password: string): Promise<UserEntity> {
    const user = await this.findOneById(userId);

    if (!(await compare(password, user.password))) {
      throw new BadRequestException('Wrong password');
    }

    await this.commonService.removeEntity(this.usersRepository, user);
    return user;
  }

  public async updateInternal(
    user: UserEntity,
    data: Partial<IUser>,
  ): Promise<void> {
    Object.entries(data).forEach(([key, value]) => {
      if (isUndefined(value)) {
        return;
      }
      user[key] = value;
    });
    await this.commonService.saveEntity(this.usersRepository, user);
  }

  public async updatePicture(
    userId: number,
    updateDto: PictureDto,
  ): Promise<UserEntity> {
    const user = await this.findOneById(userId);
    const oldPicture = user.picture;
    const { picture } = updateDto;
    user.picture = await this.uploaderService.uploadImage(
      userId,
      picture,
      RatioEnum.SQUARE,
    );

    if (!isUndefined(oldPicture) && !isNull(oldPicture)) {
      this.uploaderService.deleteFile(oldPicture);
    }

    await this.commonService.saveEntity(this.usersRepository, user);
    return user;
  }

  public async removePicture(userId: number): Promise<UserEntity> {
    const user = await this.findOneById(userId);

    if (isUndefined(user.picture) || isNull(user.picture)) {
      throw new BadRequestException('No picture to remove');
    }

    this.uploaderService.deleteFile(user.picture);
    user.picture = null;
    await this.commonService.saveEntity(this.usersRepository, user);
    return user;
  }

  public async updateName(userId: number, name: string): Promise<UserEntity> {
    const formatName = this.commonService.formatTitle(name);
    const user = await this.findOneById(userId);
    user.name = formatName;
    user.username = await this.generateUsername(formatName);
    await this.commonService.saveEntity(this.usersRepository, user);
    return user;
  }

  public async updateOnlineStatus(
    userId: number,
    onlineStatus: OnlineStatusEnum,
  ): Promise<UserEntity> {
    const user = await this.findOneById(userId);
    user.defaultStatus = onlineStatus;
    const data = await this.cacheManager.get<ISessionsData>(
      `sessions:${userId}`,
    );

    if (!isUndefined(data) && !isNull(data)) {
      user.onlineStatus = onlineStatus;
    }

    await this.commonService.saveEntity(this.usersRepository, user);
    return user;
  }

  public async query(dto: SearchDto): Promise<IPaginated<IUser>> {
    const { search, first, after } = dto;
    const qb = this.usersRepository.createQueryBuilder(this.queryName).where({
      confirmed: true,
    });

    if (!isUndefined(search) && !isNull(search)) {
      qb.andWhere({
        name: {
          $ilike: this.commonService.formatSearch(search),
        },
      });
    }

    return this.commonService.queryBuilderPagination(
      this.queryName,
      'username',
      CursorTypeEnum.STRING,
      first,
      QueryOrderEnum.ASC,
      qb,
      after,
    );
  }

  public async findOAuthProviders(
    userId: number,
  ): Promise<OAuthProviderEntity[]> {
    return await this.oauthProvidersRepository.find(
      {
        user: userId,
      },
      { orderBy: { provider: QueryOrderEnum.ASC } },
    );
  }

  private async createOAuthProvider(
    provider: OAuthProvidersEnum,
    userId: number,
  ): Promise<OAuthProviderEntity> {
    const oauthProvider = this.oauthProvidersRepository.create({
      provider,
      user: userId,
    });
    await this.commonService.saveEntity(
      this.oauthProvidersRepository,
      oauthProvider,
      true,
    );
    return oauthProvider;
  }

  private throwUnauthorizedException(
    user: undefined | null | UserEntity,
  ): void {
    if (isUndefined(user) || isNull(user)) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  private async checkEmailUniqueness(email: string): Promise<void> {
    const count = await this.usersRepository.count({ email });

    if (count > 0) {
      throw new ConflictException('Email already in use');
    }
  }

  /**
   * Generates a unique username using a point slug based on the name
   * and if it's already in use, it adds the usernames count to the end
   */
  private async generateUsername(name: string): Promise<string> {
    const pointSlug = this.commonService.generatePointSlug(name);
    const count = await this.usersRepository.count({
      username: {
        $like: `${pointSlug}%`,
      },
    });

    if (count > 0) {
      return `${pointSlug}${count}`;
    }

    return pointSlug;
  }
}
