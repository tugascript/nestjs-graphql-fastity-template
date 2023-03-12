/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { FastifyRequest } from 'fastify';
import { IGqlCtx } from '../../common/interfaces/gql-ctx.interface';

export const CurrentUser = createParamDecorator(
  (_, context: ExecutionContext): number | undefined => {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest<FastifyRequest>()?.user;
    }

    const gqlCtx = GqlExecutionContext.create(context).getContext<IGqlCtx>();
    return gqlCtx.reply.request?.user ?? gqlCtx?.ws?.userId;
  },
);
