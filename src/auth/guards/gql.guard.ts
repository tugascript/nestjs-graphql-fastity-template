import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ICtx } from '../../common/interfaces/ctx.interface';
import { AuthService } from '../auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class GraphQLAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  public async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const ctx: ICtx = GqlExecutionContext.create(context).getContext();
    const auth = ctx.reply.request.headers.authorization;

    if (!auth) return isPublic;

    const arr = auth.split(' ');

    if (arr[0] !== 'Bearer') return isPublic;

    try {
      const { id } = await this.authService.verifyAuthToken(arr[1], 'access');
      ctx.user = id;
      return true;
    } catch (error) {
      return isPublic;
    }
  }
}
