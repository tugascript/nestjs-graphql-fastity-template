/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { MercuriusContext } from 'mercurius';

export const GetQuery = createParamDecorator(
  (_, context: ExecutionContext): string => {
    const ctx: MercuriusContext =
      GqlExecutionContext.create(context).getContext();

    return ctx.reply.request.query as string;
  },
);
