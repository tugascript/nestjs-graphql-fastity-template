import { LoadStrategy, Options } from '@mikro-orm/core';

const config: Options =
  process.env.NODE_ENV !== 'production'
    ? {
        type: 'sqlite',
        dbName: 'test.db',
        entities: ['dist/**/*.entity.js', 'dist/**/*.embeddable.js'],
        entitiesTs: ['src/**/*.entity.ts', 'src/**/*.embeddable.ts'],
        loadStrategy: LoadStrategy.JOINED,
        allowGlobalContext: true,
      }
    : {
        type: 'postgresql',
        clientUrl: process.env.DATABASE_URL,
        entities: ['dist/**/*.entity.js', 'dist/**/*.embeddable.js'],
        entitiesTs: ['src/**/*.entity.ts', 'src/**/*.embeddable.ts'],
        loadStrategy: LoadStrategy.JOINED,
        allowGlobalContext: true,
      };

export default config;
