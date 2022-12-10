import { FastifyInstance } from 'fastify';
import { MercuriusHooksObject } from '../interfaces/mercurius-hook.interface';
import { isArray, isNull, isUndefined } from './validation.util';

export const addHooks = (
  app: FastifyInstance,
  hooks?: MercuriusHooksObject,
): void => {
  if (isUndefined(hooks) || isNull(hooks)) {
    return;
  }

  for (const [hook, handler] of Object.entries(hooks) as [any, any][]) {
    if (isUndefined(handler) || isNull(handler)) {
      continue;
    }

    if (isArray<any>(handler)) {
      for (const h of handler) {
        app.graphql.addHook(hook, h);
      }

      continue;
    }

    app.graphql.addHook(hook, handler);
  }
};
