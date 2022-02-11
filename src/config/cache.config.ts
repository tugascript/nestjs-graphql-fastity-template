import {
  CacheModuleOptions,
  CacheOptionsFactory,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';
import { Redis } from 'ioredis';

@Injectable()
export class CacheConfig implements CacheOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createCacheOptions(): CacheModuleOptions {
    const ttl = this.configService.get<number>('ttl');

    return this.configService.get<boolean>('testing')
      ? { ttl }
      : {
          ttl,
          store: redisStore,
          redisInstance: this.configService.get<Redis>('redis'),
        };
  }
}
