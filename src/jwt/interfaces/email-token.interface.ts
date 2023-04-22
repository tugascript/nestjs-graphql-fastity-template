/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import { IAccessPayload } from './access-token.interface';
import { ITokenBase } from './token-base.interface';

export interface IEmailPayload extends IAccessPayload {
  version: number;
}

export interface IEmailToken extends IEmailPayload, ITokenBase {}
