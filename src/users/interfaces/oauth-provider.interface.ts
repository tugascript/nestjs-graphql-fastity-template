/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import { OAuthProvidersEnum } from '../enums/oauth-providers.enum';
import { IUser } from './user.interface';

export interface IOAuthProvider {
  readonly provider: OAuthProvidersEnum;
  readonly user: IUser;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
