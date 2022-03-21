import { IBase } from '../../common/interfaces/base.interface';
import { OnlineStatusEnum } from '../enums/online-status.enum';

export interface IUser extends IBase {
  name: string;
  username: string;
  email: string;
  picture?: string;
  onlineStatus: OnlineStatusEnum;
  lastOnline: Date;
}
