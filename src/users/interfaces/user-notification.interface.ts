import { INotification } from '../../common/interfaces/notification.interface';
import { IUser } from './user.interface';

export interface IUserNotification {
  userNotification: INotification<IUser>;
}
