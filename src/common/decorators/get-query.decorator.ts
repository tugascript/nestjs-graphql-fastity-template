import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ICtx } from '../interfaces/ctx.interface';

export const GetQuery = createParamDecorator(
  (_, context: ExecutionContext): string => {
    const ctx: ICtx = GqlExecutionContext.create(context).getContext();

    return ctx.reply.request.query as string;
  },
);
