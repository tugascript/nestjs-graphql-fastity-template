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
