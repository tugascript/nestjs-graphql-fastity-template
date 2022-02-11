import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ICtx } from '../../common/interfaces/ctx.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

// Copied from "https://docs.nestjs.com/techniques/authentication#graphql"
@Injectable()
export class GraphQLAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  public getRequest(context: ExecutionContext): Request {
    const ctx: ICtx = GqlExecutionContext.create(context).getContext();

    if (ctx.extra) return ctx.extra.request;

    return ctx.req;
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
