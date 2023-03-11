/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { ITokenBase } from './token-base.interface';

export interface IAccessPayload {
  id: number;
}

export interface IAccessToken extends IAccessPayload, ITokenBase {}
