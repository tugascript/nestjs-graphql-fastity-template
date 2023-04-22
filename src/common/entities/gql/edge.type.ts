/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

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
