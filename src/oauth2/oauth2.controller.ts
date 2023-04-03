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

import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Oauth2Service } from './oauth2.service';
import { OAuthFlagGuard } from './guards/oauth-flag.guard';
import { OAuthProvidersEnum } from './enums/oauth-providers.enum';
import { Public } from '../auth/decorators/public.decorator';
import { FastifyReply } from 'fastify';

@Controller('api/oauth2')
export class Oauth2Controller {
  constructor(private readonly oauth2Service: Oauth2Service) {}

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.MICROSOFT))
  @Get('microsoft')
  public async microsoft(@Res() res: FastifyReply) {
    return res.redirect(
      this.oauth2Service.generateAuthorizationUrl(OAuthProvidersEnum.MICROSOFT),
    );
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.GOOGLE))
  @Get('google')
  public async google(@Res() res: FastifyReply) {
    return res.redirect(
      this.oauth2Service.generateAuthorizationUrl(OAuthProvidersEnum.GOOGLE),
    );
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.FACEBOOK))
  @Get('facebook')
  public async facebook(@Res() res: FastifyReply) {
    return res.redirect(
      this.oauth2Service.generateAuthorizationUrl(OAuthProvidersEnum.FACEBOOK),
    );
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.GITHUB))
  @Get('github')
  public async github(@Res() res: FastifyReply) {
    return res.redirect(
      this.oauth2Service.generateAuthorizationUrl(OAuthProvidersEnum.GITHUB),
    );
  }
}
