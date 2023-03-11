/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { IAuthResponseUser } from './auth-response-user.interface';

export interface IAuthResponse {
  user: IAuthResponseUser;
  accessToken: string;
}
