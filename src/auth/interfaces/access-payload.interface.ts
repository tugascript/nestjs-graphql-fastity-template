export interface IAccessPayload {
  id: number;
}

export interface IAccessPayloadResponse extends IAccessPayload {
  iat: number;
  exp: number;
}
