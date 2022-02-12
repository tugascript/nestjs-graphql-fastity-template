import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ICtx } from '../../common/interfaces/ctx.interface';

export const CurrentUser = createParamDecorator(
  (_, context: ExecutionContext): number => {
    const ctx: ICtx = GqlExecutionContext.create(context).getContext();

    return ctx.user;
  },
);
