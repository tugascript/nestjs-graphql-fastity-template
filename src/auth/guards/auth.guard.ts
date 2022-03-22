import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IGqlCtx } from '../../common/interfaces/gql-ctx.interface';
import { AuthService } from '../auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IExtendedRequest } from '../interfaces/extended-request.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (context.getType() === 'http') {
      return await this.setHttpHeader(
        context.switchToHttp().getRequest(),
        isPublic,
      );
    }

    const gqlCtx: IGqlCtx = GqlExecutionContext.create(context).getContext();

    if (gqlCtx.ws) {
      return await this.authService.refreshUserSession(gqlCtx.ws);
    }

    return await this.setHttpHeader(gqlCtx.reply.request, isPublic);
  }

  private async setHttpHeader(
    req: IExtendedRequest,
    isPublic: boolean,
  ): Promise<boolean> {
    const auth = req.headers?.authorization;

    if (!auth) return isPublic;

    const arr = auth.split(' ');

    if (arr[0] !== 'Bearer') return isPublic;

    try {
      const { id } = await this.authService.verifyAuthToken(arr[1], 'access');
      req.user = id;
      return true;
    } catch (_) {
      return isPublic;
    }
  }
}
