/*
  Free and Open Source - MIT
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
