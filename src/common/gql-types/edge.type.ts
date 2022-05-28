import { Type } from '@nestjs/common';
import { Field, ObjectType } from '@nestjs/graphql';
import { IEdge } from '../interfaces/paginated.interface';

export function Edge<T>(classRef: Type<T>): Type<IEdge<T>> {
  @ObjectType({ isAbstract: true })
  abstract class EdgeType implements IEdge<T> {
    @Field(() => String)
    public cursor: string;

    @Field(() => classRef)
    public node: T;
  }
  return EdgeType as Type<IEdge<T>>;
}
