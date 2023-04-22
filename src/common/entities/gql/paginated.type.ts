/*
 This file is part of Nest GraphQL Fastify Template

 This project is dual-licensed under the Mozilla Public License 2.0 (MPLv2) and the
 GNU General Public License version 3 (GPLv3).

 You may use, distribute, and modify this file under the terms of either the MPLv2
 or GPLv3, at your option. If a copy of these licenses was not distributed with this
 file. You may obtain a copy of the licenses at https://www.mozilla.org/en-US/MPL/2.0/
 and https://www.gnu.org/licenses/gpl-3.0.en.html respectively.

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
