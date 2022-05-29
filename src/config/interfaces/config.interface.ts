import { S3ClientConfig } from '@aws-sdk/client-s3';
import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { UploadOptions } from 'graphql-upload';
import { RedisOptions } from 'ioredis';
import { IBucketData } from './bucket-data.inteface';
import { IEmailConfig } from './email-config.interface';
import { IJwt } from './jwt.interface';

export interface IConfig {
  port: number;
  playground: boolean;
  url: string;
  db: MikroOrmModuleOptions;
  jwt: IJwt;
  emailService: IEmailConfig;
  bucketConfig: S3ClientConfig;
  bucketData: IBucketData;
  redis?: RedisOptions;
  ttl: number;
  upload: UploadOptions;
  testing: boolean;
  sessionTime: number;
  throttler: ThrottlerModuleOptions;
}
