import {
  CacheModuleOptions,
  CacheOptionsFactory,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { ioredisStore } from '../common/stores/ioredis.store';

@Injectable()
export class CacheConfig implements CacheOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createCacheOptions(): CacheModuleOptions {
    const ttl = this.configService.get<number>('ttl');

    return this.configService.get<boolean>('testing')
      ? { ttl }
      : {
          ttl,
          store: ioredisStore,
          redisInstance: this.configService.get<Redis>('redis'),
        };
  }
}
