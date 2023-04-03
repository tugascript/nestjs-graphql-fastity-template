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

import { S3ClientConfig } from '@aws-sdk/client-s3';
import { MikroOrmModuleOptions } from '@mikro-orm/nestjs';
import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { UploadOptions } from 'graphql-upload/processRequest';
import { RedisOptions } from 'ioredis';
import { IBucketData } from './bucket-data.inteface';
import { IEmailConfig } from './email-config.interface';
import { IJwt } from './jwt.interface';

export interface IConfig {
  readonly port: number;
  readonly url: string;
  readonly db: MikroOrmModuleOptions;
  readonly jwt: IJwt;
  readonly emailService: IEmailConfig;
  readonly bucketConfig: S3ClientConfig;
  readonly bucketData: IBucketData;
  readonly redis?: RedisOptions;
  readonly ttl: number;
  readonly upload: UploadOptions;
  readonly testing: boolean;
  readonly sessionTime: number;
  readonly twoFactorTime: number;
  readonly throttler: ThrottlerModuleOptions;
  readonly googleOAuthFlag: boolean;
  readonly googleOAuth?: {};
  readonly appleOAuthFlag: boolean;
  readonly facebookOAuth?: {};
}
