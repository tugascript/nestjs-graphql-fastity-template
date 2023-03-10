/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

export interface IAccessPayload {
  id: number;
}

export interface IAccessPayloadResponse extends IAccessPayload {
  iat: number;
  exp: number;
}
