/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

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
