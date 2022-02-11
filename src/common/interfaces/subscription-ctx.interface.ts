import { Request } from 'express';
import { SubscribePayload } from 'graphql-ws';
import { ILoaders } from '../../dataloaders/interfaces/loaders.interface';

export interface ISubscriptionCtx {
  socket: WebSocket;
  request: Request;
  payload: SubscribePayload;
  loaders?: ILoaders;
}
