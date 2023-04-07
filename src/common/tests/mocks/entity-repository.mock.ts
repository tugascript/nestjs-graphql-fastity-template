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

import { EntityRepository } from '@mikro-orm/postgresql';
import { EntityMock } from './entity.mock';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export class EntityRepositoryMock implements EntityRepository<EntityMock> {
  persist = jest.fn();
  flush = jest.fn();
  removeAndFlush = jest.fn();
}
