/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { registerEnumType } from '@nestjs/graphql';

export enum NotificationTypeEnum {
  NEW = 'NEW',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

registerEnumType(NotificationTypeEnum, {
  name: 'NotificationType',
});
