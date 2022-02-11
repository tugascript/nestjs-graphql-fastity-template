import { registerEnumType } from '@nestjs/graphql';

export enum NotificationTypeEnum {
  NEW = 'NEW',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

registerEnumType(NotificationTypeEnum, {
  name: 'NotificationType',
});
