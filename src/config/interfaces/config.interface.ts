/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

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
import { IOAuth2 } from './oauth2.interface';

export interface IConfig {
  readonly port: number;
  readonly domain: string;
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
  readonly oauth2: IOAuth2;
}
