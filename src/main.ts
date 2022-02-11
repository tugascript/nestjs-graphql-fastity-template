import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { json } from 'express';
import { graphqlUploadExpress, UploadOptions } from 'graphql-upload';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableCors({
    credentials: true,
    origin: configService.get<string>('url'),
  });
  app.use(json());
  app.use(cookieParser());
  app.use(graphqlUploadExpress(configService.get<UploadOptions>('upload')));
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(configService.get<number>('port'));
}
bootstrap();
