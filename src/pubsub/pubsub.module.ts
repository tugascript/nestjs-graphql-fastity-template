import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { PubSub } from 'graphql-subscriptions';
import { RedisOptions } from 'ioredis';

export const PUB_SUB = 'PUB_SUB';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PUB_SUB,
      useFactory: (configService: ConfigService) =>
        configService.get<boolean>('testing')
          ? new PubSub()
          : new RedisPubSub({
              connection: configService.get<RedisOptions>('redis'),
            }),
      inject: [ConfigService],
    },
  ],
  exports: [PUB_SUB],
})
export class PubsubModule {}
