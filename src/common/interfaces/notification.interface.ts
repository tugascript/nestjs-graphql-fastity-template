import { NotificationTypeEnum } from '../enums/notification-type.enum';
import { IEdge } from './paginated.interface';

export interface INotification<T> {
  type: NotificationTypeEnum;
  edge: IEdge<T>;
}
