import { Field, ObjectType } from '@nestjs/graphql';
import { LocalMessageType } from '../../common/gql-types/message.type';
import { UserEntity } from '../../users/entities/user.entity';

@ObjectType('Auth')
export class AuthType {
  @Field(() => String)
  public accessToken!: string;

  @Field(() => UserEntity)
  public user!: UserEntity;

  @Field(() => LocalMessageType, { nullable: true })
  public message?: LocalMessageType;

  constructor(
    accessToken: string,
    user: UserEntity,
    message?: LocalMessageType,
  ) {
    this.accessToken = accessToken;
    this.user = user;
    this.message = message;
  }
}
