import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyCsrf from '@fastify/csrf-protection';
import { UploadOptions } from 'graphql-upload';
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
    origin: configService.get<string>('url'),
  });
  app.register(fastifyCookie, {
    secret: configService.get<string>('COOKIE_SECRET'),
  });
  app.register(fastifyCsrf, { cookieOpts: { signed: true } });
  app.register(mercuriusUpload, configService.get<UploadOptions>('upload'));
  app.register(fastifyStatic, {
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
