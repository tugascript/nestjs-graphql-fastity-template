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

import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { MercuriusDriverConfig, MercuriusPlugin } from '@nestjs/mercurius';
import AltairFastify, {
  AltairFastifyPluginOptions,
} from 'altair-fastify-plugin';
import { GraphQLError } from 'graphql';
import Redis, { RedisOptions } from 'ioredis';
import mercuriusCache, { MercuriusCacheOptions } from 'mercurius-cache';
import mqRedis from 'mqemitter-redis';
import { AuthService } from '../auth/auth.service';
import { IGqlCtx } from '../common/interfaces/gql-ctx.interface';
import { LoadersService } from '../loaders/loaders.service';
import { IWsCtx } from './interfaces/ws-ctx.interface';
import { IWsParams } from './interfaces/ws-params.interface';
import { isNull, isUndefined } from './utils/validation.util';

@Injectable()
export class GqlConfigService
  implements GqlOptionsFactory<MercuriusDriverConfig>
{
  private readonly testing = this.configService.get<boolean>('testing');
  private readonly redisOpt = this.configService.get<RedisOptions>('redis');

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly loadersService: LoadersService,
  ) {}

  public createGqlOptions(): MercuriusDriverConfig {
    const plugins: MercuriusPlugin<
      MercuriusCacheOptions | AltairFastifyPluginOptions
    >[] = [
      {
        plugin: mercuriusCache,
        options: {
          ttl: 60,
          all: true,
          storage: this.testing
            ? {
                type: 'memory',
                options: {
                  size: 1024,
                },
              }
            : {
                type: 'redis',
                options: {
                  client: new Redis(this.redisOpt),
                  size: 2048,
                },
              },
        } as MercuriusCacheOptions,
      },
    ];

    if (this.testing) {
      plugins.push({
        plugin: AltairFastify,
        options: {
          path: '/altair',
          baseURL: '/altair/',
          endpointURL: '/api/graphql',
        } as AltairFastifyPluginOptions,
      });
    }

    return {
      graphiql: false,
      ide: false,
      path: '/api/graphql',
      routes: true,
      subscription: {
        fullWsTransport: true,
        emitter: this.testing
          ? undefined
          : mqRedis({
              port: this.redisOpt.port,
              host: this.redisOpt.host,
              password: this.redisOpt.password,
            }),
        onConnect: async (info): Promise<{ ws: IWsCtx } | false> => {
          const { authorization }: IWsParams = info.payload;

          if (!authorization) return false;

          const authArr = authorization.split(' ');

          if (authArr.length !== 2 && authArr[0] !== 'Bearer') return false;

          try {
            const [userId, sessionId] =
              await this.authService.generateWsSession(authArr[1]);
            return { ws: { userId, sessionId } };
          } catch (_) {
            return false;
          }
        },
        onDisconnect: async (ctx) => {
          const { ws } = ctx as IGqlCtx;

          if (!ws) return;

          await this.authService.closeUserSession(ws);
        },
      },
      hooks: {
        preSubscriptionExecution: async (
          _,
          __,
          ctx: IGqlCtx,
        ): Promise<void> => {
          const { ws } = ctx;

          if (isUndefined(ws) || isNull(ws)) {
            throw new UnauthorizedException('Unauthorized');
          }

          await this.authService.refreshUserSession(ws);
        },
      },
      autoSchemaFile: './schema.gql',
      errorFormatter: (error) => {
        const org = error.errors[0].originalError as HttpException;
        return {
          statusCode: org.getStatus(),
          response: {
            errors: [org.getResponse() as GraphQLError],
            data: null,
          },
        };
      },
      plugins,
    };
  }
}
