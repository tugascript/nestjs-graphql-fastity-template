import { FastifyRequest } from 'fastify';
import { SubscribePayload } from 'graphql-ws';
import { ILoaders } from '../../dataloaders/interfaces/loaders.interface';

export interface ISubscriptionCtx {
  socket: WebSocket;
  request: FastifyRequest;
  payload: SubscribePayload;
  loaders?: ILoaders;
}
