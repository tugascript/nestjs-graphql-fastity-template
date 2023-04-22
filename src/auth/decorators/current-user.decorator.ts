/*
 This file is part of Nest GraphQL Fastify Template

 This project is dual-licensed under the Mozilla Public License 2.0 (MPLv2) and the
 GNU General Public License version 3 (GPLv3).

 You may use, distribute, and modify this file under the terms of either the MPLv2
 or GPLv3, at your option. If a copy of these licenses was not distributed with this
 file. You may obtain a copy of the licenses at https://www.mozilla.org/en-US/MPL/2.0/
 and https://www.gnu.org/licenses/gpl-3.0.en.html respectively.

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
