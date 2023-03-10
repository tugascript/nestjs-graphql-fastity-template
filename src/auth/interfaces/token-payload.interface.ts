/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { IAccessPayload } from './access-payload.interface';

export interface ITokenPayload extends IAccessPayload {
  count: number;
}

export interface ITokenPayloadResponse extends ITokenPayload {
  iat: number;
  exp: number;
}
