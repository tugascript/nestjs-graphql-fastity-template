import { Type } from '@nestjs/common';
import { Field, ObjectType } from '@nestjs/graphql';
import { NotificationTypeEnum } from '../../enums/notification-type.enum';
import { INotification } from '../../interfaces/notification.interface';
import { Edge } from './edge.type';

export function Notification<T>(classRef: Type<T>): Type<INotification<T>> {
  @ObjectType(`${classRef.name}NotificationEdge`)
  abstract class EdgeType extends Edge(classRef) {}

  @ObjectType({ isAbstract: true })
  abstract class NotificationType {
    @Field(() => NotificationTypeEnum)
    public type: NotificationTypeEnum;

    @Field(() => EdgeType)
    public edge: EdgeType;
  }

  return NotificationType as Type<INotification<T>>;
}
