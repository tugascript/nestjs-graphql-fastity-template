/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import {
  CanActivate,
  ExecutionContext,
  mixin,
  NotFoundException,
  Type,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';
import { isNull } from '../../config/utils/validation.util';
import { OAuthProvidersEnum } from '../../users/enums/oauth-providers.enum';
import { IClient } from '../interfaces/client.interface';

export const OAuthFlagGuard = (
  provider: OAuthProvidersEnum,
): Type<CanActivate> => {
  class OAuthFlagGuardClass implements CanActivate {
    constructor(private readonly configService: ConfigService) {}

    public canActivate(context: ExecutionContext): boolean {
      const client = this.configService.get<IClient | null>(
        `oauth2.${provider}`,
      );

      if (isNull(client)) {
        const request = context.switchToHttp().getRequest<FastifyRequest>();
        throw new NotFoundException(`Cannot ${request.method} ${request.url}`);
      }

      return true;
    }
  }

  return mixin(OAuthFlagGuardClass);
};
