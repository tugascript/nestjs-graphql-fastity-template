/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

export interface ISingleJwt {
  secret: string;
  time: number;
}

export interface IJwt {
  access: ISingleJwt;
  confirmation: ISingleJwt;
  resetPassword: ISingleJwt;
  refresh: ISingleJwt;
}
