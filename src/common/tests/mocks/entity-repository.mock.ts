/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import { EntityRepository } from '@mikro-orm/postgresql';
import { EntityMock } from './entity.mock';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export class EntityRepositoryMock implements EntityRepository<EntityMock> {
  persist = jest.fn();
  flush = jest.fn();
  removeAndFlush = jest.fn();
}
