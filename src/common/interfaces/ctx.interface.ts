import { FastifyReply, FastifyRequest } from 'fastify';
import { ILoaders } from '../../dataloaders/interfaces/loaders.interface';
import { ISubscriptionCtx } from './subscription-ctx.interface';

export interface ICtx {
  res: FastifyReply;
  req: FastifyRequest;
  user?: number;
  loaders?: ILoaders;
  extra?: ISubscriptionCtx;
}
