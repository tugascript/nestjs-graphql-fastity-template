/*
 Free and Open Source - GNU GPLv3

 This file is part of nestjs-graphql-fastify-template

 nestjs-graphql-fastify-template is distributed in the
 hope that it will be useful, but WITHOUT ANY WARRANTY;
 without even the implied warranty of MERCHANTABILITY
 or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 General Public License for more details.

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
