import { IGqlCtx } from '../interfaces/gql-ctx.interface';

export const contextToUser = (ctx: IGqlCtx): number => {
  return ctx.ws.userId ?? (ctx.reply.request as any).user;
};
