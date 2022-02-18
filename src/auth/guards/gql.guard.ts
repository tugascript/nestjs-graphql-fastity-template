import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { MercuriusContext } from 'mercurius';
import { AuthService } from '../auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IExtendedRequest } from '../interfaces/extended-request.interface';

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

    const request = this.getRequest(context);
    const auth = request.headers.authorization;

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

  // For the public REST routes
  public getRequest(context: ExecutionContext): IExtendedRequest {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    }

    return (
      GqlExecutionContext.create(context).getContext() as MercuriusContext
    ).reply.request as unknown as IExtendedRequest;
  }
}
