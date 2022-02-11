import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ICtx } from '../interfaces/ctx.interface';

export const GetQuery = createParamDecorator(
  (_, context: ExecutionContext): string => {
    const ctx: ICtx = GqlExecutionContext.create(context).getContext();

    if (ctx.extra) return ctx.extra.payload.query;

    return ctx.req.body.query;
  },
);
