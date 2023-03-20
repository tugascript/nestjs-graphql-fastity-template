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

import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyStatic from '@fastify/static';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import mercuriusUpload from 'mercurius-upload';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const configService = app.get(ConfigService);
  const testing = configService.get<boolean>('testing');
  app.register(fastifyCors as any, {
    credentials: true,
    origin: configService.get<string>('url'),
  });
  app.register(fastifyCookie as any, {
    secret: configService.get<string>('COOKIE_SECRET'),
  });
  app.register(fastifyCsrf as any, { cookieOpts: { signed: true } });
  app.register(mercuriusUpload as any, configService.get('upload'));
  app.register(fastifyStatic as any, {
    root: join(__dirname, '..', 'public'),
    decorateReply: !testing,
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(
    configService.get<number>('port'),
    testing ? '127.0.0.1' : '0.0.0.0', // because of nginx
  );
}

bootstrap();
