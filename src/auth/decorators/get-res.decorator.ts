import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { FastifyReply } from 'fastify';
import { ICtx } from '../../common/interfaces/ctx.interface';

export const GetRes = createParamDecorator(
  (_, context: ExecutionContext): FastifyReply => {
    const ctx: ICtx = GqlExecutionContext.create(context).getContext();

    return ctx.reply;
  },
);
