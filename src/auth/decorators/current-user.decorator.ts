import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (_, context: ExecutionContext): number => {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest().user;
    }

    return GqlExecutionContext.create(context).getContext().reply.request.user;
  },
);
