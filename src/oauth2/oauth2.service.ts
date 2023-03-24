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

import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { IAuth } from './interfaces/auth.interface';
import { AuthorizationCode } from 'simple-oauth2';
import { randomBytes } from 'crypto';
import { OAuthProvidersEnum } from './enums/oauth-providers.enum';
import { isNull } from '../config/utils/validation.util';
import { IOAuth } from './interfaces/oauth.interface';
import { IAuthorization } from './interfaces/authorization.interface';
import { IToken } from './interfaces/token.interface';

@Injectable()
export class Oauth2Service {
  private static readonly MICROSOFT_AUTH: IAuth = {
    authorizeHost: 'https://login.microsoftonline.com',
    authorizePath: '/common/oauth2/v2.0/authorize',
    tokenHost: 'https://login.microsoftonline.com',
    tokenPath: '/common/oauth2/v2.0/token',
  };
  private static readonly GOOGLE_AUTH: IAuth = {
    authorizeHost: 'https://accounts.google.com',
    authorizePath: '/o/oauth2/v2/auth',
    tokenHost: 'https://www.googleapis.com',
    tokenPath: '/oauth2/v4/token',
  };
  private static readonly APPLE_AUTH: IAuth = {
    authorizeHost: 'https://appleid.apple.com',
    authorizePath: '/auth/authorize',
    tokenHost: 'https://appleid.apple.com',
    tokenPath: '/auth/token',
  };
  private static readonly FACEBOOK_AUTH: IAuth = {
    authorizeHost: 'https://facebook.com',
    authorizePath: '/v6.0/dialog/oauth',
    tokenHost: 'https://graph.facebook.com',
    tokenPath: '/v6.0/oauth/access_token',
  };
  private static readonly GITHUB_AUTH: IAuth = {
    tokenHost: 'https://github.com',
    tokenPath: '/login/oauth/access_token',
    authorizePath: '/login/oauth/authorize',
  };
  private readonly googleClient: AuthorizationCode | null;
  private readonly googleAuthorization: IAuthorization | null;
  private readonly microsoftClient: AuthorizationCode | null;
  private readonly microsoftAuthorization: IAuthorization | null;
  private readonly appleClient: AuthorizationCode | null;
  private readonly appleAuthorization: IAuthorization | null;
  private readonly facebookClient: AuthorizationCode | null;
  private readonly facebookAuthorization: IAuthorization | null;
  private readonly githubClient: AuthorizationCode | null;
  private readonly githubAuthorization: IAuthorization | null;

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    [this.googleClient, this.googleAuthorization] =
      Oauth2Service.generateAuthorizationCode(
        OAuthProvidersEnum.GOOGLE,
        configService,
      );
    [this.microsoftClient, this.microsoftAuthorization] =
      Oauth2Service.generateAuthorizationCode(
        OAuthProvidersEnum.MICROSOFT,
        configService,
      );
    [this.appleClient, this.appleAuthorization] =
      Oauth2Service.generateAuthorizationCode(
        OAuthProvidersEnum.APPLE,
        configService,
      );
    [this.facebookClient, this.facebookAuthorization] =
      Oauth2Service.generateAuthorizationCode(
        OAuthProvidersEnum.FACEBOOK,
        configService,
      );
    [this.githubClient, this.githubAuthorization] =
      Oauth2Service.generateAuthorizationCode(
        OAuthProvidersEnum.GITHUB,
        configService,
      );
  }

  private static generateState(): string {
    return randomBytes(16).toString('hex');
  }

  private static getAuth(provider: OAuthProvidersEnum): IAuth | null {
    switch (provider) {
      case OAuthProvidersEnum.GOOGLE:
        return Oauth2Service.GOOGLE_AUTH;
      case OAuthProvidersEnum.MICROSOFT:
        return Oauth2Service.MICROSOFT_AUTH;
      case OAuthProvidersEnum.APPLE:
        return Oauth2Service.APPLE_AUTH;
      case OAuthProvidersEnum.FACEBOOK:
        return Oauth2Service.FACEBOOK_AUTH;
      case OAuthProvidersEnum.GITHUB:
        return Oauth2Service.GITHUB_AUTH;
      default:
        return null;
    }
  }

  private static generateAuthorizationCode(
    provider: OAuthProvidersEnum,
    configService: ConfigService,
  ): [AuthorizationCode | null, IAuthorization | null] {
    const oauth = configService.get<IOAuth | null>(`oauth2.${provider}`);
    const auth = Oauth2Service.getAuth(provider);

    if (isNull(oauth) || isNull(auth)) {
      return [null, null];
    }

    return [
      new AuthorizationCode({ auth, client: oauth.client }),
      {
        ...oauth.authorization,
        state: Oauth2Service.generateState(),
      },
    ];
  }

  public generateAuthorizationUrl(provider: OAuthProvidersEnum): string {
    const [code, authorization] = this.getOAuth(provider);

    if (isNull(code) || isNull(authorization)) {
      throw new NotFoundException('Page not found');
    }

    return code.authorizeURL(authorization);
  }

  private async getAccessToken(
    provider: OAuthProvidersEnum,
    code: string,
    state: string,
  ): Promise<string> {
    const [client, authorization] = this.getOAuth(provider);

    if (isNull(client) || isNull(authorization)) {
      throw new NotFoundException('Page not found');
    }

    if (state !== authorization.state) {
      throw new NotFoundException('Page not found');
    }

    const result = await client.getToken({
      code,
      redirect_uri: authorization.redirect_uri,
      scope: authorization.scope,
    });

    return (result.token as unknown as IToken).access_token;
  }

  private getOAuth(
    provider: OAuthProvidersEnum,
  ): [AuthorizationCode, IAuthorization] {
    switch (provider) {
      case OAuthProvidersEnum.GOOGLE:
        return [this.googleClient, this.googleAuthorization];
      case OAuthProvidersEnum.MICROSOFT:
        return [this.microsoftClient, this.microsoftAuthorization];
      case OAuthProvidersEnum.APPLE:
        return [this.appleClient, this.appleAuthorization];
      case OAuthProvidersEnum.FACEBOOK:
        return [this.facebookClient, this.facebookAuthorization];
      case OAuthProvidersEnum.GITHUB:
        return [this.githubClient, this.githubAuthorization];
      default:
        throw new NotFoundException('Page not found');
    }
  }
}
