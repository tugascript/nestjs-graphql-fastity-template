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

import { TokenType, WreckHttpOptions } from 'simple-oauth2';

declare module 'simple-oauth2' {
  export interface AccessToken {
    readonly token: {
      readonly token_type: 'bearer';
      readonly access_token: string;
      readonly refresh_token?: string;
      readonly expires_in: number;
      readonly expires_at: Date;
    };

    expired(expirationWindowSeconds?: number): boolean;

    refresh(
      params?: {
        scope?: string | string[] | undefined;
      },
      httpOptions?: WreckHttpOptions,
    ): Promise<AccessToken>;

    revoke(tokenType: TokenType, httpOptions?: WreckHttpOptions): Promise<void>;

    revokeAll(httpOptions?: WreckHttpOptions): Promise<void>;
  }
}
