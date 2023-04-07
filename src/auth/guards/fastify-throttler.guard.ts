/*
 Free and Open Source - GNU GPLv3

 This file is part of nestjs-graphql-fastify-template

 nestjs-graphql-fastify-template is distributed in the
 hope that it will be useful, but WITHOUT ANY WARRANTY;
 without even the implied warranty of MERCHANTABILITY
 or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 General Public License for more details.

 Copyright © 2023
 Afonso Barracha
*/

import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FastifyReply, FastifyRequest } from 'fastify';
import { IFastifyExpress } from '../interfaces/fastify-express.interface';

@Injectable()
export class FastifyThrottlerGuard extends ThrottlerGuard {
  public getRequestResponse(context: ExecutionContext): IFastifyExpress {
    const http = context.switchToHttp();
    return {
      req: http.getRequest<FastifyRequest>(),
      res: http.getResponse<FastifyReply>(),
    };
  }
}
