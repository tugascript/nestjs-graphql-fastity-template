import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ThrottlerModuleOptions,
  ThrottlerOptionsFactory,
} from '@nestjs/throttler';
import { RedisOptions } from 'ioredis';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';

@Injectable()
export class ThrottlerConfig implements ThrottlerOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createThrottlerOptions(): ThrottlerModuleOptions {
    const config = this.configService.get<ThrottlerModuleOptions>('throttler');
    return this.configService.get<boolean>('testing')
      ? config
      : {
          ...config,
          storage: new ThrottlerStorageRedisService(
            this.configService.get<RedisOptions>('redis'),
          ),
        };
  }
}
