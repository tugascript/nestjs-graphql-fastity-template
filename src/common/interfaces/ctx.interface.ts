import { Request, Response } from 'express';
import { ILoaders } from '../../dataloaders/interfaces/loaders.interface';
import { ISubscriptionCtx } from './subscription-ctx.interface';

export interface ICtx {
  res: Response;
  req: Request;
  loaders?: ILoaders;
  extra?: ISubscriptionCtx;
}
