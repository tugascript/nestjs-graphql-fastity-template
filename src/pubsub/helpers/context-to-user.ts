import { Request } from 'express';
import { ICtx } from '../../common/interfaces/ctx.interface';

export const contextToUser = (ctx: ICtx): number => {
  if (ctx?.extra) return (ctx.extra.request as Request)?.user as number;

  return (ctx.req as Request).user as number;
};
