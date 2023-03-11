/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { IUser } from '../../users/interfaces/user.interface';

export interface IAuthResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}
