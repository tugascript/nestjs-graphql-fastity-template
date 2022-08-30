import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IBase } from '../interfaces/base.interface';

@ObjectType({ isAbstract: true })
@Entity({ abstract: true })
export abstract class LocalBaseEntity implements IBase {
  @Field(() => Int)
  @PrimaryKey()
  public id: number;

  @Field(() => String)
  @Property({ onCreate: () => new Date() })
  public createdAt: Date = new Date();

  @Field(() => String)
  @Property({ onUpdate: () => new Date() })
  public updatedAt: Date = new Date();
}
