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

import { randomBytes } from 'crypto';
import { AuthorizationCode } from 'simple-oauth2';
import { OAuthProvidersEnum } from '../../users/enums/oauth-providers.enum';
import { IAuth } from '../interfaces/auth.interface';
import { IAuthorization } from '../interfaces/authorization.interface';
import { IClient } from '../interfaces/client.interface';

export class OAuthClass {
  private static readonly [OAuthProvidersEnum.MICROSOFT]: IAuth = {
    authorizeHost: 'https://login.microsoftonline.com',
    authorizePath: '/common/oauth2/v2.0/authorize',
    tokenHost: 'https://login.microsoftonline.com',
    tokenPath: '/common/oauth2/v2.0/token',
  };
  private static readonly [OAuthProvidersEnum.GOOGLE]: IAuth = {
    authorizeHost: 'https://accounts.google.com',
    authorizePath: '/o/oauth2/v2/auth',
    tokenHost: 'https://www.googleapis.com',
    tokenPath: '/oauth2/v4/token',
  };
  private static readonly [OAuthProvidersEnum.FACEBOOK]: IAuth = {
    authorizeHost: 'https://facebook.com',
    authorizePath: '/v6.0/dialog/oauth',
    tokenHost: 'https://graph.facebook.com',
    tokenPath: '/v6.0/oauth/access_token',
  };
  private static readonly [OAuthProvidersEnum.GITHUB]: IAuth = {
    authorizeHost: 'https://github.com',
    authorizePath: '/login/oauth/authorize',
    tokenHost: 'https://github.com',
    tokenPath: '/login/oauth/access_token',
  };

  private readonly _code: AuthorizationCode;
  private readonly _authorization: IAuthorization;
  private readonly _dataUrl: string;

  constructor(
    private readonly provider: OAuthProvidersEnum,
    private readonly client: IClient,
    private readonly url: string,
  ) {
    if (provider === OAuthProvidersEnum.LOCAL) {
      throw new Error('Invalid provider');
    }

    this._code = new AuthorizationCode({
      client,
      auth: OAuthClass[provider],
    });
    this._authorization = OAuthClass.genAuthorization(provider, url);
    this._dataUrl = OAuthClass.getUserDataUrl(provider);
  }

  public get state(): string {
    return this._authorization.state;
  }

  public get dataUrl(): string {
    return this._dataUrl;
  }

  public get authorizationUrl(): string {
    return this._code.authorizeURL(this._authorization);
  }

  private static genAuthorization(
    provider: OAuthProvidersEnum,
    url: string,
  ): IAuthorization {
    const redirect_uri = `${url}/${provider.toLowerCase()}/callback`;
    const state = randomBytes(16).toString('hex');

    switch (provider) {
      case OAuthProvidersEnum.GOOGLE:
        return {
          state,
          redirect_uri,
          scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
          ],
        };
      case OAuthProvidersEnum.MICROSOFT:
        return {
          state,
          redirect_uri,
          scope: ['openid', 'profile', 'email'],
        };
      case OAuthProvidersEnum.FACEBOOK:
        return {
          state,
          redirect_uri,
          scope: ['email', 'public_profile'],
        };
      case OAuthProvidersEnum.GITHUB:
        return {
          state,
          redirect_uri,
          scope: ['user:email', 'read:user'],
        };
    }
  }

  private static getUserDataUrl(provider: OAuthProvidersEnum): string {
    switch (provider) {
      case OAuthProvidersEnum.GOOGLE:
        return 'https://www.googleapis.com/oauth2/v3/userinfo';
      case OAuthProvidersEnum.MICROSOFT:
        return 'https://graph.microsoft.com/v1.0/me';
      case OAuthProvidersEnum.FACEBOOK:
        return 'https://graph.facebook.com/v16.0/me?fields=email,name,picture';
      case OAuthProvidersEnum.GITHUB:
        return 'https://api.github.com/user';
    }
  }

  public async getToken(code: string): Promise<string> {
    const result = await this._code.getToken({
      code,
      redirect_uri: this._authorization.redirect_uri,
      scope: this._authorization.scope,
    });
    return result.token.access_token as string;
  }
}
