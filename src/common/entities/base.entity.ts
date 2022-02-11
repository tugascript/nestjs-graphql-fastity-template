import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@Entity({ abstract: true })
export abstract class LocalBaseEntity {
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
