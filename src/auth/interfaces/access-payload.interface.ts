export interface IAccessPayload {
  id: number;
  sessionId?: string;
}

export interface IAccessPayloadResponse extends IAccessPayload {
  iat: number;
  exp: number;
}
