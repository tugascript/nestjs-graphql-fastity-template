/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { INotification } from '../../common/interfaces/notification.interface';
import { IUser } from './user.interface';

export interface IUserNotification {
  userNotification: INotification<IUser>;
}
