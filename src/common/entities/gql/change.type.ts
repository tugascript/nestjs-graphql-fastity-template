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
import { ChangeTypeEnum } from '../../enums/change-type.enum';
import { IChange } from '../../interfaces/change.interface';
import { Edge } from './edge.type';

export function Change<T>(classRef: Type<T>): Type<IChange<T>> {
  @ObjectType(`${classRef.name}NotificationEdge`)
  abstract class EdgeType extends Edge(classRef) {}

  @ObjectType({ isAbstract: true })
  abstract class ChangeType implements IChange<T> {
    @Field(() => ChangeTypeEnum)
    public type: ChangeTypeEnum;

    @Field(() => EdgeType)
    public edge: EdgeType;
  }

  return ChangeType as Type<IChange<T>>;
}
