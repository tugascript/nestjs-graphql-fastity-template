/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { IChange } from '../../common/interfaces/change.interface';
import { IUser } from './user.interface';

export interface IUserChange {
  userChange: IChange<IUser>;
}
