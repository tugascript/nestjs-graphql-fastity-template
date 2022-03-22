import { Field, ObjectType } from '@nestjs/graphql';
import { LocalBaseType } from '../../common/gql-types/base.type';
import { OnlineStatusEnum } from '../enums/online-status.enum';
import { IUser } from '../interfaces/user.interface';
import { ownerMiddleware } from '../middleware/owner.middleware';

@ObjectType('User')
export class UserType extends LocalBaseType implements IUser {
  @Field(() => String)
  public name!: string;

  @Field(() => String)
  public username!: string;

  @Field(() => String, { nullable: true, middleware: [ownerMiddleware] })
  public email!: string;

  @Field(() => String, { nullable: true })
  public picture?: string;

  @Field(() => OnlineStatusEnum)
  public onlineStatus: OnlineStatusEnum;

  @Field(() => String)
  public lastOnline: Date;
}
