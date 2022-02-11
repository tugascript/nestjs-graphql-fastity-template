export interface ITokenPayload {
  id: number;
  count: number;
}

export interface ITokenPayloadResponse extends ITokenPayload {
  iat: number;
  exp: number;
}
