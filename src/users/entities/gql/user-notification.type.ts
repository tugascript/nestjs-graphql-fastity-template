import { ObjectType } from '@nestjs/graphql';
import { Notification } from '../../../common/entities/gql/notification.type';
import { UserEntity } from '../user.entity';

@ObjectType('UserNotification')
export abstract class UserNotificationType extends Notification<UserEntity>(
  UserEntity,
) {}
