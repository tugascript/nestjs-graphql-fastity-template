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
