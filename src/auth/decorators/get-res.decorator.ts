import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Response } from 'express';
import { ICtx } from '../../common/interfaces/ctx.interface';

export const GetRes = createParamDecorator(
  (_, context: ExecutionContext): Response => {
    const ctx: ICtx = GqlExecutionContext.create(context).getContext();

    if (ctx.extra)
      throw new UnauthorizedException(
        'Response does not exist in ws connection',
      );

    return ctx.res;
  },
);
