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

import { LoadStrategy, Options } from '@mikro-orm/core';
import { defineConfig as definePGConfig } from '@mikro-orm/postgresql';
import { defineConfig as defineSqliteConfig } from '@mikro-orm/sqlite';

const baseOptions = {
  entities: ['dist/**/*.entity.js', 'dist/**/*.embeddable.js'],
  entitiesTs: ['src/**/*.entity.ts', 'src/**/*.embeddable.ts'],
  loadStrategy: LoadStrategy.JOINED,
  allowGlobalContext: true,
};

const config: Options =
  process.env.NODE_ENV === 'production'
    ? definePGConfig({
        ...baseOptions,
        clientUrl: process.env.DATABASE_URL,
      })
    : defineSqliteConfig({
        ...baseOptions,
        dbName: ':memory:',
      });

export default config;
