/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

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
