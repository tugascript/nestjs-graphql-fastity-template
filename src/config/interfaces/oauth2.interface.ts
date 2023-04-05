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

import { IOAuth } from '../../oauth2/interfaces/oauth.interface';

export interface IOAuth2 {
  readonly microsoft: IOAuth | null;
  readonly google: IOAuth | null;
  readonly facebook: IOAuth | null;
  readonly github: IOAuth | null;
}
