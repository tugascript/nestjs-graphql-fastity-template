/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { Redis } from 'ioredis';

export interface ITtl {
  ttl?: number;
}

export interface IORedisStoreOptions extends ITtl {
  redis: Redis;
}
