import { Redis } from 'ioredis';

export interface ITtl {
  ttl?: number;
}

export interface IORedisStoreOptions extends ITtl {
  redis: Redis;
}
