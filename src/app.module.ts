/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver } from '@nestjs/mercurius';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/guards/auth.guard';
import { CommonModule } from './common/common.module';
import { CacheConfig } from './config/cache.config';
import { config } from './config/config';
import { GqlConfigService } from './config/graphql.config';
import { MikroOrmConfig } from './config/mikroorm.config';
import { validationSchema } from './config/validation';
import { EmailModule } from './email/email.module';
import { LoadersModule } from './loaders/loaders.module';
import { UploaderModule } from './uploader/uploader.module';
import { UsersModule } from './users/users.module';
import { JwtModule } from './jwt/jwt.module';

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
    UsersModule,
    CommonModule,
    AuthModule,
    EmailModule,
    UploaderModule,
    LoadersModule,
    JwtModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AppController],
})
export class AppModule {}
