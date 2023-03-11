/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { OnlineStatusEnum } from '../enums/online-status.enum';
import { ICredentials } from './credentials.interface';

export interface IUser {
  id: number;
  name: string;
  username: string;
  email: string;
  picture?: string;
  password: string;
  confirmed: boolean;
  twoFactor: boolean;
  credentials: ICredentials;
  onlineStatus: OnlineStatusEnum;
  defaultStatus: OnlineStatusEnum;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
  lastOnline: Date;
}
