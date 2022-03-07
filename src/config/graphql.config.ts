import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { RedisOptions } from 'ioredis';
import mercuriusCache from 'mercurius-cache';
import redis from 'mqemitter-redis';
import { AuthService } from '../auth/auth.service';
import { MercuriusExtendedDriverConfig } from './interfaces/mercurius-extended-driver-config.interface';

@Injectable()
export class GqlConfigService implements GqlOptionsFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  private readonly testing = this.configService.get<boolean>('testing');
  private readonly redisOpt = this.configService.get<RedisOptions>('redis');

  public createGqlOptions(): MercuriusExtendedDriverConfig {
    return {
      graphiql: false,
      ide: false,
      path: '/api/graphql',
      routes: true,
      subscription: {
        fullWsTransport: true,
        emitter: this.testing ? undefined : redis(this.redisOpt),
        onConnect: async ({ payload }) => {
          const authParam: string | undefined = payload.authorization;

          if (!authParam) return {};

          const authArr = authParam.split(' ');

          if (authArr[0] !== 'Bearer') return {};

          try {
            const wsAccess = await this.authService.generateWsAccessToken(
              authArr[1],
            );

            return { wsAccess };
          } catch (_) {
            return {};
          }
        },
      },
      plugins: [
        {
          plugin: mercuriusCache,
          options: {
            ttl: this.configService.get<number>('ttl'),
            all: true,
          },
        },
      ],
      autoSchemaFile: './schema.gql',
    };
  }
}
