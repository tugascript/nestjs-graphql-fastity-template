import { FieldMiddleware, MiddlewareContext, NextFn } from '@nestjs/graphql';
import { contextToUser } from '../../pubsub/helpers/context-to-user';

export const ownerMiddleware: FieldMiddleware = async (
  { source, context }: MiddlewareContext,
  next: NextFn,
) => {
  const userId = contextToUser(context);
  return userId && userId === source.id ? await next() : null;
};
