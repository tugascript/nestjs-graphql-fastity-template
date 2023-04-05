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
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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
  app.register(fastifyCors, {
    credentials: true,
    origin: `https://${configService.get<string>('DOMAIN')}`,
  });
  app.register(fastifyCookie, {
    secret: configService.get<string>('COOKIE_SECRET'),
  });
  app.register(fastifyCsrf, { cookieOpts: { signed: true } });
  app.register(mercuriusUpload, configService.get('upload'));
  app.register(fastifyStatic, {
    root: join(__dirname, '..', 'public'),
    decorateReply: !testing,
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NestJS Authentication API')
    .setDescription('An OAuth2.0 authentication API made with NestJS')
    .setVersion('0.0.1')
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
