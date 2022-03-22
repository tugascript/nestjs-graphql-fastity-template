import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IExtendedContext } from 'src/common/interfaces/extended-context.interface';
import { IExtendedRequest } from '../interfaces/extended-request.interface';

export const CurrentUser = createParamDecorator(
  (_, context: ExecutionContext): number | undefined => {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest()?.user;
    }

    const gqlCtx: IExtendedContext =
      GqlExecutionContext.create(context).getContext();
    return (gqlCtx.reply.request as IExtendedRequest).user ?? gqlCtx.user;
  },
);
