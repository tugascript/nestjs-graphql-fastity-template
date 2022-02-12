import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { FastifyReply } from 'fastify';
import { MercuriusContext } from 'mercurius';

export const GetRes = createParamDecorator(
  (_, context: ExecutionContext): FastifyReply => {
    const ctx: MercuriusContext =
      GqlExecutionContext.create(context).getContext();

    return ctx.reply;
  },
);
