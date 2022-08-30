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
import { SearchDto } from '../common/dtos/search.dto';
import { LocalMessageType } from '../common/entities/gql/message.type';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { GetUserDto } from './dtos/get-user.dto';
import { OnlineStatusDto } from './dtos/online-status.dto';
import { ProfilePictureDto } from './dtos/profile-picture.dto';
import { UserNotificationDto } from './dtos/user-notification.dto';
import { UserDto } from './dtos/user.dto';
import { PaginatedUsersType } from './entities/gql/paginated-users.type';
import { UserNotificationType } from './entities/gql/user-notification.type';
import { UserEntity } from './entities/user.entity';
import { OnlineStatusEnum } from './enums/online-status.enum';
import { IUserNotification } from './interfaces/user-notification.interface';
import { UsersService } from './users.service';

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  //____________________ MUTATIONS ____________________

  @Mutation(() => UserEntity)
  public async updateProfilePicture(
    @Context('pubsub') pubsub: PubSub,
    @CurrentUser() userId: number,
    @Args() dto: ProfilePictureDto,
  ): Promise<UserEntity> {
    return this.usersService.updateProfilePicture(pubsub, userId, dto);
  }

  @Mutation(() => UserEntity)
  public async updateOnlineStatus(
    @Context('pubsub') pubsub: PubSub,
    @CurrentUser() userId: number,
    @Args() dto: OnlineStatusDto,
  ): Promise<UserEntity> {
    return this.usersService.updateDefaultStatus(pubsub, userId, dto);
  }

  @Mutation(() => LocalMessageType)
  public async deleteAccount(
    @CurrentUser() userId: number,
    @Args('password') password: string,
  ): Promise<LocalMessageType> {
    return this.usersService.deleteUser(userId, password);
  }

  //____________________ QUERIES ____________________

  @Query(() => UserEntity)
  public async me(@CurrentUser() userId: number): Promise<UserEntity> {
    return this.usersService.userById(userId);
  }

  //____________________ PUBLIC QUERIES ____________________

  @Public()
  @Query(() => UserEntity)
  public async userByUsername(@Args() dto: GetUserDto): Promise<UserEntity> {
    return this.usersService.userByUsername(dto.username);
  }

  @Public()
  @Query(() => UserEntity)
  public async userById(@Args() dto: UserDto): Promise<UserEntity> {
    return this.usersService.userById(dto.userId);
  }

  @Public()
  @Query(() => PaginatedUsersType, { name: 'users' })
  public async filterUsers(
    @Args() dto: SearchDto,
  ): Promise<IPaginated<UserEntity>> {
    return this.usersService.filterUsers(dto);
  }

  @Public()
  @Subscription(() => UserNotificationType, {
    filter: (payload: IUserNotification, variables: UserNotificationDto) => {
      return (
        !variables.userId ||
        payload.userNotification.edge.node.id === variables.userId
      );
    },
  })
  public async userNotification(
    @Context('pubsub') pubsub: PubSub,
    @Args() dto: UserNotificationDto,
  ) {
    return pubsub.subscribe<IUserNotification>('USER_NOTIFICATION');
  }

  //____________________ RESOLVE FIELDS ____________________
  @ResolveField('email', () => String, { nullable: true })
  public resolveEmail(
    @Parent() user: UserEntity,
    @CurrentUser() userId?: number,
  ): string | null {
    return userId && user.id === userId ? user.email : null;
  }

  @ResolveField('twoFactor', () => Boolean, { nullable: true })
  public resolveTwoFactor(
    @Parent() user: UserEntity,
    @CurrentUser() userId?: number,
  ): boolean | null {
    return userId && user.id === userId ? user.twoFactor : null;
  }

  @ResolveField('defaultStatus', () => OnlineStatusEnum, { nullable: true })
  public resolveDefaultStatus(
    @Parent() user: UserEntity,
    @CurrentUser() userId?: number,
  ): OnlineStatusEnum | null {
    return userId && user.id === userId ? user.defaultStatus : null;
  }
}
