import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Edge } from './edge.type';

@ObjectType('PageInfo')
abstract class PageInfoType {
  @Field(() => String)
  public endCursor: string;

  @Field(() => Boolean)
  public hasNextPage: boolean;
}

export function Paginated<T>(classRef: Type<T>): any {
  @ObjectType(`${classRef.name}PageEdge`)
  abstract class EdgeType extends Edge(classRef) {}

  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => Int)
    public totalCount: number;

    @Field(() => [EdgeType])
    public edges: EdgeType[];

    @Field(() => PageInfoType)
    public pageInfo: PageInfoType;
  }
  return PaginatedType;
}
