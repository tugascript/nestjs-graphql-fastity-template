import { Type } from '@nestjs/common';
import { Field, ObjectType } from '@nestjs/graphql';

export function Edge<T>(classRef: Type<T>): any {
  @ObjectType({ isAbstract: true })
  abstract class EdgeType {
    @Field(() => String)
    public cursor: string;

    @Field(() => classRef)
    public node: T;
  }
  return EdgeType;
}
