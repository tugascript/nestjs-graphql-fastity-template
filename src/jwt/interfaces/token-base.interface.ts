/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

export interface ITokenBase {
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  sub: string;
}
