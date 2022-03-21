import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IBase } from '../interfaces/base.interface';

@ObjectType({ isAbstract: true })
export abstract class LocalBaseType implements IBase {
  @Field(() => Int)
  public id: number;

  @Field(() => String)
  public createdAt: Date = new Date();

  @Field(() => String)
  public updatedAt: Date = new Date();
}
