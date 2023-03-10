/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { IBase } from '../../common/interfaces/base.interface';
import { OnlineStatusEnum } from '../enums/online-status.enum';
import { ICredentials } from './credentials.interface';

export interface IUser extends IBase {
  name: string;
  username: string;
  email: string;
  picture?: string;
  onlineStatus: OnlineStatusEnum;
  lastOnline: Date;
  credentials: ICredentials;
}
