/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { FastifyRequest } from 'fastify';

export interface IExtendedRequest extends FastifyRequest {
  user?: number;
}
