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

import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Oauth2Service } from './oauth2.service';
import { OAuthFlagGuard } from './guards/oauth-flag.guard';
import { OAuthProvidersEnum } from '../users/enums/oauth-providers.enum';
import { Public } from '../auth/decorators/public.decorator';
import { FastifyReply } from 'fastify';
import {
  IFacebookUser,
  IGitHubUser,
  IGoogleUser,
  IMicrosoftUser,
} from './interfaces/user-response.interface';
import { CallbackQueryDto } from './dtos/callback-query.dto';
import { ConfigService } from '@nestjs/config';

@Controller('api/oauth2')
export class Oauth2Controller {
  private readonly url: string;
  private readonly cookiePath = '/api/auth';
  private readonly cookieName: string;
  private readonly refreshTime: number;
  private readonly testing: boolean;

  constructor(
    private readonly oauth2Service: Oauth2Service,
    private readonly configService: ConfigService,
  ) {
    this.url = `https://${this.configService.get<string>('DOMAIN')}`;
    this.cookieName = this.configService.get<string>('REFRESH_COOKIE');
    this.refreshTime = this.configService.get<number>('jwt.refresh.time');
    this.testing = this.configService.get<boolean>('testing');
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.MICROSOFT))
  @Get('microsoft')
  public microsoft(@Res() res: FastifyReply): FastifyReply {
    return res.redirect(
      this.oauth2Service.generateAuthorizationUrl(OAuthProvidersEnum.MICROSOFT),
    );
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.MICROSOFT))
  @Get('microsoft/callback')
  public async microsoftCallback(
    @Query() cbQuery: CallbackQueryDto,
    @Res() res: FastifyReply,
  ) {
    const provider = OAuthProvidersEnum.MICROSOFT;
    const { displayName, mail } =
      await this.oauth2Service.getUserData<IMicrosoftUser>(provider, cbQuery);
    return this.loginAndRedirect(res, provider, mail, displayName);
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.GOOGLE))
  @Get('google')
  public google(@Res() res: FastifyReply): FastifyReply {
    return res.redirect(
      this.oauth2Service.generateAuthorizationUrl(OAuthProvidersEnum.GOOGLE),
    );
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.GOOGLE))
  @Get('google/callback')
  public async googleCallback(
    @Query() cbQuery: CallbackQueryDto,
    @Res() res: FastifyReply,
  ) {
    const provider = OAuthProvidersEnum.GOOGLE;
    const { name, email } = await this.oauth2Service.getUserData<IGoogleUser>(
      provider,
      cbQuery,
    );
    return this.loginAndRedirect(res, provider, email, name);
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.FACEBOOK))
  @Get('facebook')
  public facebook(@Res() res: FastifyReply): FastifyReply {
    return res.redirect(
      this.oauth2Service.generateAuthorizationUrl(OAuthProvidersEnum.FACEBOOK),
    );
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.FACEBOOK))
  @Get('facebook/callback')
  public async facebookCallback(
    @Query() cbQuery: CallbackQueryDto,
    @Res() res: FastifyReply,
  ) {
    const provider = OAuthProvidersEnum.FACEBOOK;
    const { name, email } = await this.oauth2Service.getUserData<IFacebookUser>(
      provider,
      cbQuery,
    );
    return this.loginAndRedirect(res, provider, email, name);
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.GITHUB))
  @Get('github')
  public github(@Res() res: FastifyReply): FastifyReply {
    return res.redirect(
      this.oauth2Service.generateAuthorizationUrl(OAuthProvidersEnum.GITHUB),
    );
  }

  @Public()
  @UseGuards(OAuthFlagGuard(OAuthProvidersEnum.GITHUB))
  @Get('github/callback')
  public async githubCallback(
    @Query() cbQuery: CallbackQueryDto,
    @Res() res: FastifyReply,
  ) {
    const provider = OAuthProvidersEnum.GITHUB;
    const { name, email } = await this.oauth2Service.getUserData<IGitHubUser>(
      provider,
      cbQuery,
    );
    return this.loginAndRedirect(res, provider, email, name);
  }

  private async loginAndRedirect(
    res: FastifyReply,
    provider: OAuthProvidersEnum,
    email: string,
    name: string,
  ): Promise<FastifyReply> {
    const [accessToken, refreshToken] = await this.oauth2Service.login(
      provider,
      email,
      name,
    );
    return res
      .cookie(this.cookieName, refreshToken, {
        secure: !this.testing,
        httpOnly: true,
        signed: true,
        path: this.cookiePath,
        expires: new Date(Date.now() + this.refreshTime * 1000),
      })
      .redirect(`${this.url}/?access_token=${accessToken}`);
  }
}
