import { ICtx } from '../../common/interfaces/ctx.interface';

export const contextToUser = (ctx: ICtx): number => {
  return ctx.user;
};
