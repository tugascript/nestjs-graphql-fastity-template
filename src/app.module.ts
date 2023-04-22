/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver } from '@nestjs/mercurius';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/guards/auth.guard';
import { CommonModule } from './common/common.module';
import { config } from './config';
import { CacheConfig } from './config/cache.config';
import { GqlConfigService } from './config/graphql.config';
import { MikroOrmConfig } from './config/mikroorm.config';
import { ThrottlerConfig } from './config/throttler.config';
import { validationSchema } from './config/validation.config';
import { EmailModule } from './email/email.module';
import { JwtModule } from './jwt/jwt.module';
import { LoadersModule } from './loaders/loaders.module';
import { Oauth2Module } from './oauth2/oauth2.module';
import { UploaderModule } from './uploader/uploader.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: [config],
    }),
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: MikroOrmConfig,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useClass: CacheConfig,
    }),
    GraphQLModule.forRootAsync({
      imports: [ConfigModule, AuthModule, LoadersModule],
      driver: MercuriusDriver,
      useClass: GqlConfigService,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useClass: ThrottlerConfig,
    }),
    UsersModule,
    CommonModule,
    AuthModule,
    EmailModule,
    UploaderModule,
    LoadersModule,
    JwtModule,
    Oauth2Module,
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AppController],
})
export class AppModule {}
