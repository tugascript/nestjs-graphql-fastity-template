/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { IGqlCtx } from '../interfaces/gql-ctx.interface';

export const contextToUser = (ctx: IGqlCtx): number => {
  return ctx.ws.userId ?? (ctx.reply.request as any).user;
};
