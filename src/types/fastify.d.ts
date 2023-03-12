/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { FastifyRequest as Request } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest extends Request {
    user?: number;
  }
}
