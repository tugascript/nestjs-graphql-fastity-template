import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlOptionsFactory } from '@nestjs/graphql';
import altair from 'altair-fastify-plugin';
import { FastifyRequest } from 'fastify';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { PubSub } from 'graphql-subscriptions';
import { RedisOptions } from 'ioredis';
import mercuriusCache from 'mercurius-cache';
import { AuthService } from '../auth/auth.service';
import { MercuriusExtendedDriverConfig } from './interfaces/mercurius-extended-driver-config.interface';

@Injectable()
export class GqlConfigService implements GqlOptionsFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  private readonly cookieName =
    this.configService.get<string>('REFRESH_COOKIE');
  private readonly testing = this.configService.get<boolean>('testing');

  public createGqlOptions(): MercuriusExtendedDriverConfig {
    return {
      graphiql: false,
      ide: false,
      path: '/api/graphql',
      routes: true,
      subscription: {
        fullWsTransport: true,
        pubsub: this.configService.get<boolean>('testing')
          ? new PubSub()
          : new RedisPubSub({
              connection: this.configService.get<RedisOptions>('redis'),
            }),
      },
      context: (req: FastifyRequest) => {
        return { authorization: req.headers.authorization };
      },
      plugins: [
        {
          plugin: mercuriusCache,
          options: {
            ttl: this.configService.get<number>('ttl'),
            all: true,
          },
        },
        {
          plugin: altair,
          options: {
            path: '/altair',
            baseURL: '/altair/',
            endpointURL: '/api/graphql',
          },
        },
      ],
      autoSchemaFile: './schema.gql',
    };
  }
}
