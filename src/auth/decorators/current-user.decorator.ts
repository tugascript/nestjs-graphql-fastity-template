import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { ICtx } from '../../common/interfaces/ctx.interface';

export const CurrentUser = createParamDecorator(
  (_, context: ExecutionContext): number => {
    const ctx: ICtx = GqlExecutionContext.create(context).getContext();

    if (ctx.extra) return (ctx.extra.request as Request).user as number;

    return (ctx.req as Request).user as number;
  },
);
