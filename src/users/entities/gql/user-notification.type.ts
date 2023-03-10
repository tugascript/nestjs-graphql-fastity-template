/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { ObjectType } from '@nestjs/graphql';
import { Notification } from '../../../common/entities/gql/notification.type';
import { UserEntity } from '../user.entity';

@ObjectType('UserNotification')
export abstract class UserNotificationType extends Notification<UserEntity>(
  UserEntity,
) {}
