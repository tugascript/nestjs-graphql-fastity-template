/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import { Collection } from '@mikro-orm/core';
import { OnlineStatusEnum } from '../enums/online-status.enum';
import { ICredentials } from './credentials.interface';

export interface IUser {
  id: number;
  oauthProviders: Collection<any, any>;
  name: string;
  username: string;
  email: string;
  picture?: string;
  password: string;
  confirmed: boolean;
  twoFactor: boolean;
  credentials: ICredentials;
  onlineStatus: OnlineStatusEnum;
  defaultStatus: OnlineStatusEnum;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
  lastOnline: Date;
}
