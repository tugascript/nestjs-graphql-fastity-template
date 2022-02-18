export const contextToUser = (ctx: Record<string, any>): number => {
  return ctx.user.reply.request.user;
};
