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

  public async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = this.getRequest(context);

    if (request === true) return request;

    const auth = request?.headers?.authorization;

    if (!auth) return isPublic;

    const arr = auth.split(' ');

    if (arr[0] !== 'Bearer') return isPublic;

    try {
      const { id } = await this.authService.verifyAuthToken(arr[1], 'access');
      request.user = id;
      return true;
    } catch (error) {
      return isPublic;
    }
  }

  // // For the public REST routes
  private getRequest(context: ExecutionContext): IExtendedRequest | true {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    }

    const gqlCtx: IGqlCtx = GqlExecutionContext.create(context).getContext();

    if (gqlCtx.user) return true;

    return gqlCtx.reply.request as unknown as IExtendedRequest;
  }
}
