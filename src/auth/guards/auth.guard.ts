/*
 This file is part of Nest GraphQL Fastify Template

 This project is dual-licensed under the Mozilla Public License 2.0 (MPLv2) and the
 GNU General Public License version 3 (GPLv3).

 You may use, distribute, and modify this file under the terms of either the MPLv2
 or GPLv3, at your option. If a copy of these licenses was not distributed with this
 file. You may obtain a copy of the licenses at https://www.mozilla.org/en-US/MPL/2.0/
 and https://www.gnu.org/licenses/gpl-3.0.en.html respectively.

 Copyright © 2023
 Afonso Barracha
*/

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { isJWT } from 'class-validator';
import { FastifyRequest } from 'fastify';
import { IGqlCtx } from '../../common/interfaces/gql-ctx.interface';
import { isNull, isUndefined } from '../../config/utils/validation.util';
import { TokenTypeEnum } from '../../jwt/enums/token-type.enum';
import { JwtService } from '../../jwt/jwt.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (context.getType() === 'http') {
      const activate = await this.setHttpHeader(
        context.switchToHttp().getRequest<FastifyRequest>(),
        isPublic,
      );

      if (!activate) {
        throw new UnauthorizedException();
      }

      return activate;
    }

    const gqlCtx = GqlExecutionContext.create(context).getContext<IGqlCtx>();

    if (!isUndefined(gqlCtx.ws) && !isNull(gqlCtx.ws)) {
      return true;
    }

    return this.setHttpHeader(gqlCtx.reply.request, isPublic);
  }

  /**
   * Sets HTTP Header
   *
   * Checks if the header has a valid Bearer token, validates it and sets the User ID as the user.
   */
  private async setHttpHeader(
    req: FastifyRequest,
    isPublic: boolean,
  ): Promise<boolean> {
    const auth = req.headers?.authorization;

    if (isUndefined(auth) || isNull(auth) || auth.length === 0) {
      return isPublic;
    }

    const authArr = auth.split(' ');
    const bearer = authArr[0];
    const token = authArr[1];

    if (isUndefined(bearer) || isNull(bearer) || bearer !== 'Bearer') {
      return isPublic;
    }
    if (isUndefined(token) || isNull(token) || !isJWT(token)) {
      return isPublic;
    }

    try {
      const { id } = await this.jwtService.verifyToken(
        token,
        TokenTypeEnum.ACCESS,
      );
      req.user = id;
      return true;
    } catch (_) {
      return isPublic;
    }
  }
}
