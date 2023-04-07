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
import { Field, ObjectType } from '@nestjs/graphql';
import { IEdge } from '../../interfaces/paginated.interface';

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
