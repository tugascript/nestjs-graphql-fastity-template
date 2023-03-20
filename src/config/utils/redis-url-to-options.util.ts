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

import { RedisOptions } from 'ioredis';

export const redisUrlToOptions = (url: string): RedisOptions => {
  if (url.includes('://:')) {
    const arr = url.split('://:')[1].split('@');
    const secondArr = arr[1].split(':');

    return {
      password: arr[0],
      host: secondArr[0],
      port: parseInt(secondArr[1], 10),
    };
  }

  const connectionString = url.split('://')[1];
  const arr = connectionString.split(':');
  return {
    host: arr[0],
    port: parseInt(arr[1], 10),
  };
};
