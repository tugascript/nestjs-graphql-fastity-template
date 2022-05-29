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
