/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

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
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import mercuriusUpload from 'mercurius-upload';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const configService = app.get(ConfigService);
  const testing = configService.get<boolean>('testing');
  app.register(fastifyCors, {
    credentials: true,
    origin: `https://${configService.get<string>('DOMAIN')}`,
  });
  app.register(fastifyCookie, {
    secret: configService.get<string>('COOKIE_SECRET'),
  });
  // TODO: remove any when fastify-csrf-protection is updated
  app.register(fastifyCsrf, { cookieOpts: { signed: true } } as any);
  app.register(mercuriusUpload, configService.get('upload'));
  app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    decorateReply: !testing,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS API')
    .setDescription('An API made with NestJS')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Authentication API')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(
    configService.get<number>('port'),
    testing ? '127.0.0.1' : '0.0.0.0', // because of nginx
  );
}

bootstrap();
