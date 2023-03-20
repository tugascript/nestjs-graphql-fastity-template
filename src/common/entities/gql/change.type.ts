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
