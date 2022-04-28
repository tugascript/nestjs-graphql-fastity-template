import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { LocalMessageType } from '../common/gql-types/message.type';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { GetUserDto } from './dtos/get-user.dto';
import { GetUsersDto } from './dtos/get-users.dto';
import { OnlineStatusDto } from './dtos/online-status.dto';
import { ProfilePictureDto } from './dtos/profile-picture.dto';
import { UserEntity } from './entities/user.entity';
import { PaginatedUsersType } from './gql-types/paginated-users.type';
import { UserType } from './gql-types/user.type';
import { UsersService } from './users.service';

@Resolver(() => UserType)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  //____________________ MUTATIONS ____________________

  @Mutation(() => UserType)
  public async updateProfilePicture(
    @CurrentUser() userId: number,
    @Args() dto: ProfilePictureDto,
  ): Promise<UserEntity> {
    return this.usersService.updateProfilePicture(userId, dto);
  }

  @Mutation(() => LocalMessageType)
  public async updateOnlineStatus(
    @CurrentUser() userId: number,
    @Args() dto: OnlineStatusDto,
  ): Promise<LocalMessageType> {
    return this.usersService.updateDefaultStatus(userId, dto);
  }

  @Mutation(() => LocalMessageType)
  public async deleteAccount(
    @CurrentUser() userId: number,
    @Args('password') password: string,
  ): Promise<LocalMessageType> {
    return this.usersService.deleteUser(userId, password);
  }

  //____________________ QUERIES ____________________

  @Query(() => UserType)
  public async me(@CurrentUser() userId: number): Promise<UserEntity> {
    return this.usersService.getUserById(userId);
  }

  //____________________ PUBLIC QUERIES ____________________
  /*
    Usefull for social media style apps where user haves descriptions
    and profiles, I haven't implemented a profile in the user entity
    but these are just example queries in case you implement one of
    your own
  */

  @Public()
  @Query(() => UserType)
  public async getUser(@Args() dto: GetUserDto): Promise<UserEntity> {
    return this.usersService.getUserByUsername(dto.username);
  }

  @Public()
  @Query(() => PaginatedUsersType)
  public async findUsers(
    @Args() dto: GetUsersDto,
  ): Promise<IPaginated<UserEntity>> {
    return this.usersService.findUsers(dto);
  }

  //____________________ RESOLVE FIELDS ____________________

  @ResolveField('email', () => String, { nullable: true })
  public getEmail(
    @Parent() user: UserEntity,
    @CurrentUser() userId: number,
  ): string | null {
    return user.id === userId ? user.email : null;
  }
}
