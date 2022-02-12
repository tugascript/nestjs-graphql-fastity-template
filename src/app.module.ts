import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { MercuriusDriver } from '@nestjs/mercurius';
import { AuthModule } from './auth/auth.module';
import { GraphQLAuthGuard } from './auth/guards/gql.guard';
import { CommonModule } from './common/common.module';
import { CacheConfig } from './config/cache.config';
import { config } from './config/config';
import { GqlConfigService } from './config/graphql.config';
import { MikroOrmConfig } from './config/mikroorm.config';
import { validationSchema } from './config/validation';
import { DataloadersModule } from './dataloaders/dataloaders.module';
import { EmailModule } from './email/email.module';
import { PubsubModule } from './pubsub/pubsub.module';
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
      imports: [ConfigModule],
      useClass: CacheConfig,
    }),
    GraphQLModule.forRootAsync({
      imports: [ConfigModule, AuthModule, DataloadersModule, PubsubModule],
      driver: MercuriusDriver,
      useClass: GqlConfigService,
    }),
    UsersModule,
    CommonModule,
    AuthModule,
    EmailModule,
    UploaderModule,
    PubsubModule,
    DataloadersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GraphQLAuthGuard,
    },
  ],
})
export class AppModule {}
