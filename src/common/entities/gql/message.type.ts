import { Field, ID, ObjectType } from '@nestjs/graphql';
import { v4 as uuidV4 } from 'uuid';

@ObjectType('Message')
export class LocalMessageType {
  @Field(() => ID)
  public id!: string;

  @Field(() => String)
  public message!: string;

  constructor(message: string) {
    this.id = uuidV4();
    this.message = message;
  }
}
