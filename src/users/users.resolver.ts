/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import {
  Args,
  Context,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
  Subscription,
} from '@nestjs/graphql';
import { PubSub } from 'mercurius';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CommonService } from '../common/common.service';
import { IdDto } from '../common/dtos/id.dto';
import { SearchDto } from '../common/dtos/search.dto';
import { LocalMessageType } from '../common/entities/gql/message.type';
import { ChangeTypeEnum } from '../common/enums/change-type.enum';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { isNull, isUndefined } from '../config/utils/validation.util';
import { PictureDto } from '../uploader/dtos/picture.dto';
import { NameDto } from './dtos/name.dto';
import { OnlineStatusDto } from './dtos/online-status.dto';
import { PasswordDto } from './dtos/password.dto';
import { UpdateEmailDto } from './dtos/update-email.dto';
import { UsernameDto } from './dtos/username.dto';
import { PaginatedUsersType } from './entities/gql/paginated-users.type';
import { UserChangeType } from './entities/gql/user-change.type';
import { UserEntity } from './entities/user.entity';
import { OnlineStatusEnum } from './enums/online-status.enum';
import { IUserChange } from './interfaces/user-change.interface';
import { IUser } from './interfaces/user.interface';
import { UsersService } from './users.service';

const USER_CHANGE_TOPIC = 'USER_CHANGE';

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly commonService: CommonService,
  ) {}

  @Mutation(() => UserEntity)
  public async updateUserPicture(
    @Context('pubsub') pubsub: PubSub,
    @CurrentUser() userId: number,
    @Args() dto: PictureDto,
  ): Promise<UserEntity> {
    const user = await this.usersService.updatePicture(userId, dto);
    this.publishUserChange(pubsub, user, ChangeTypeEnum.UPDATE);
    return user;
  }

  @Mutation(() => UserEntity)
  public async updateUserOnlineStatus(
    @Context('pubsub') pubsub: PubSub,
    @CurrentUser() userId: number,
    @Args() dto: OnlineStatusDto,
  ): Promise<UserEntity> {
    const user = await this.usersService.updateOnlineStatus(
      userId,
      dto.onlineStatus,
    );
    this.publishUserChange(pubsub, user, ChangeTypeEnum.UPDATE);
    return user;
  }

  @Mutation(() => UserEntity)
  public async updateUserName(
    @Context('pubsub') pubsub: PubSub,
    @CurrentUser() userId: number,
    @Args() dto: NameDto,
  ): Promise<UserEntity> {
    const user = await this.usersService.updateName(userId, dto.name);
    this.publishUserChange(pubsub, user, ChangeTypeEnum.UPDATE);
    return user;
  }

  @Mutation(() => UserEntity)
  public async updateUserEmail(
    @CurrentUser() userId: number,
    @Args() dto: UpdateEmailDto,
  ): Promise<UserEntity> {
    return this.usersService.updateEmail(userId, dto);
  }

  @Mutation(() => LocalMessageType)
  public async deleteUser(
    @Context('pubsub') pubsub: PubSub,
    @CurrentUser() userId: number,
    @Args() dto: PasswordDto,
  ): Promise<LocalMessageType> {
    const user = await this.usersService.delete(userId, dto.password);
    this.publishUserChange(pubsub, user, ChangeTypeEnum.DELETE);
    return new LocalMessageType('User deleted successfully');
  }

  @Public()
  @Query(() => UserEntity)
  public async userById(@Args() dto: IdDto): Promise<UserEntity> {
    return this.usersService.findOneById(dto.id);
  }

  @Public()
  @Query(() => UserEntity)
  public async userByUsername(@Args() dto: UsernameDto): Promise<UserEntity> {
    return this.usersService.findOneByUsername(dto.username);
  }

  @Public()
  @Query(() => PaginatedUsersType)
  public async queryUsers(@Args() dto: SearchDto): Promise<IPaginated<IUser>> {
    return this.usersService.query(dto);
  }

  @Subscription(() => UserChangeType, {
    filter: (payload: IUserChange, variables: IdDto): boolean => {
      const { id } = variables;
      return (
        isUndefined(id) || isNull(id) || payload.userChange.edge.node.id === id
      );
    },
  })
  public async userChange(
    @Context('pubsub') pubsub: PubSub,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Args() _: IdDto,
  ): Promise<unknown> {
    return pubsub.subscribe<IUserChange>(USER_CHANGE_TOPIC);
  }

  @ResolveField('email', () => String, { nullable: true })
  public resolveEmail(
    @Parent() user: UserEntity,
    @CurrentUser() userId?: number,
  ): string | null {
    return !isUndefined(userId) && !isNull(userId) && user.id === userId
      ? user.email
      : null;
  }

  @ResolveField('twoFactor', () => Boolean, { nullable: true })
  public resolveTwoFactor(
    @Parent() user: UserEntity,
    @CurrentUser() userId?: number,
  ): boolean | null {
    return !isUndefined(userId) && !isNull(userId) && user.id === userId
      ? user.twoFactor
      : null;
  }

  @ResolveField('defaultStatus', () => OnlineStatusEnum, { nullable: true })
  public resolveDefaultStatus(
    @Parent() user: UserEntity,
    @CurrentUser() userId?: number,
  ): OnlineStatusEnum | null {
    return !isUndefined(userId) && !isNull(userId) && user.id === userId
      ? user.defaultStatus
      : null;
  }

  private publishUserChange(
    pubsub: PubSub,
    user: UserEntity,
    notificationType: ChangeTypeEnum,
  ): void {
    pubsub.publish<IUserChange>({
      topic: USER_CHANGE_TOPIC,
      payload: {
        userChange: this.commonService.generateChange(
          user,
          notificationType,
          'username',
        ),
      },
    });
  }
}
