import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { MercuriusDriver, MercuriusDriverConfig } from '@nestjs/mercurius';
import { FastifyReply, FastifyRequest } from 'fastify';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { AuthService } from '../auth/auth.service';
import { DataloadersService } from '../dataloaders/dataloaders.service';
import { PUB_SUB } from '../pubsub/pubsub.module';

@Injectable()
export class GqlConfigService implements GqlOptionsFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly loadersService: DataloadersService,
    @Inject(PUB_SUB)
    private readonly pubSub: RedisPubSub,
  ) {}

  private readonly cookieName =
    this.configService.get<string>('REFRESH_COOKIE');
  private readonly testing = this.configService.get<boolean>('testing');

  public createGqlOptions(): MercuriusDriverConfig {
    return {
      driver: MercuriusDriver,
      graphiql: this.configService.get<boolean>('playground'),
      path: '/api/graphql',
      routes: true,
      context: async (req: FastifyRequest) => {
        const auth = req.headers.authorization;
        console.log(req.headers);

        if (auth) {
          const arr = auth.split(' ');

          if (arr[0] == 'Bearer') {
            const { id } = await this.authService.verifyAuthToken(
              arr[1],
              'access',
            );
            return { user: id };
          }
        }
      },
      subscription: {
        fullWsTransport: true,
      },
      autoSchemaFile: true,
    };
  }

  private async setHeader(req: FastifyRequest, token: string): Promise<void> {
    const cookieArr: string[] = req.headers.cookie?.split('; ') ?? [];

    if (cookieArr.length > 0) {
      for (const cookie of cookieArr) {
        if (cookie.startsWith(`${this.cookieName}=`)) {
          const refreshToken = cookie.split('=')[1];
          const wsToken = await this.authService.generateWsAccessToken(
            token,
            refreshToken,
          );
          req.headers.authorization = `Bearer ${wsToken}`;
          return;
        }
      }
    }

    throw new UnauthorizedException();
  }
}
