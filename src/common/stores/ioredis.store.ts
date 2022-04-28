import { CacheStoreFactory } from '@nestjs/common';
import { Store } from 'cache-manager';
import { Callback, Redis } from 'ioredis';
import { IORedisStoreOptions } from '../interfaces/ioredis-store-options.interface';

class IORedisStore implements Store {
  constructor({ redis, ttl = 5 }: IORedisStoreOptions) {
    this.redis = redis;
    this.ttlValue = ttl;
  }

  public readonly name = 'ioredis';
  private readonly ttlValue: number;
  private readonly redis: Redis;

  public getClient() {
    return this.redis;
  }

  public async set<T>(
    key: string,
    value: T,
    options: { ttl?: number } | number | Callback<'OK'>,
    cb?: Callback<'OK'>,
  ): Promise<'OK'> {
    let ttl = this.ttlValue;

    if (typeof options === 'function') {
      cb = options;
    } else if (
      typeof options === 'object' &&
      (options.ttl || options.ttl === 0)
    ) {
      ttl = options.ttl;
    } else if (typeof options === 'number') {
      ttl = options;
    }

    return new Promise((resolve, reject) => {
      if (!cb)
        cb = (error, result) => (error ? reject(error) : resolve(result));

      if (!this.isCachableValue(value)) {
        return cb(new Error(`"${value}" is not a cacheable value`));
      }

      const val = JSON.stringify(value) ?? '"undefined"';

      if (ttl) {
        this.redis.setex(key, ttl, val, cb);
      } else {
        this.redis.set(key, val, cb);
      }
    });
  }

  public get<T>(key: string, cb?: Callback<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!cb)
        cb = (error, result) => (error ? reject(error) : resolve(result));

      this.redis
        .get(key)
        .then((val) => {
          try {
            const value = JSON.parse(val);
            cb(null, value);
          } catch (e) {
            cb(e);
          }
        })
        .catch((e) => cb(e));
    });
  }

  public del(key: string, cb?: Callback<number>): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!cb)
        cb = (error, result) => (error ? reject(error) : resolve(result));

      this.redis.del(key, cb);
    });
  }

  public keys(
    pattern: string | Callback<string[]>,
    cb?: Callback<string[]>,
  ): Promise<string[]> {
    if (typeof pattern === 'function') {
      cb = pattern;
      pattern = '*';
    }

    return new Promise((resolve, reject) => {
      if (!cb)
        cb = (error, result) => (error ? reject(error) : resolve(result));

      this.redis.keys(pattern as string, cb);
    });
  }

  public reset(cb?: Callback<'OK'>) {
    return new Promise((resolve, reject) => {
      if (!cb)
        cb = (error, result) => (error ? reject(error) : resolve(result));

      this.redis.flushdb(cb);
    });
  }

  public ttl(key: string, cb?: Callback<number>): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!cb)
        cb = (error, result) => (error ? reject(error) : resolve(result));

      this.redis.ttl(key, cb);
    });
  }

  private isCachableValue<T>(value: T): boolean {
    return value !== undefined && value !== null;
  }
}

export const ioredisStore = {
  create: (args: IORedisStoreOptions) => new IORedisStore(args),
} as unknown as CacheStoreFactory;
