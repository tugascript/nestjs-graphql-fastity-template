/*
 Free and Open Source - GNU GPLv3

 This file is part of nestjs-graphql-fastify-template

 nestjs-graphql-fastify-template is distributed in the
 hope that it will be useful, but WITHOUT ANY WARRANTY;
 without even the implied warranty of MERCHANTABILITY
 or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 General Public License for more details.

 Copyright © 2023
 Afonso Barracha
*/

import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IPageInfo, IPaginated } from '../../interfaces/paginated.interface';
import { Edge } from './edge.type';

@ObjectType('PageInfo')
abstract class PageInfoType implements IPageInfo {
  @Field(() => String)
  public startCursor: string;

  @Field(() => String)
  public endCursor: string;

  @Field(() => Boolean)
  public hasNextPage: boolean;

  @Field(() => Boolean)
  public hasPreviousPage: boolean;
}

export function Paginated<T>(classRef: Type<T>): Type<IPaginated<T>> {
  @ObjectType(`${classRef.name}PageEdge`)
  abstract class EdgeType extends Edge(classRef) {}

  @ObjectType({ isAbstract: true })
  abstract class PaginatedType implements IPaginated<T> {
    @Field(() => Int)
    public previousCount: number;

    @Field(() => Int)
    public currentCount: number;

    @Field(() => [EdgeType])
    public edges: EdgeType[];

    @Field(() => PageInfoType)
    public pageInfo: PageInfoType;
  }

  return PaginatedType as Type<IPaginated<T>>;
}
