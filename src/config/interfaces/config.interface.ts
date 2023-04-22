/*
 This file is part of Nest GraphQL Fastify Template

 This project is dual-licensed under the Mozilla Public License 2.0 (MPLv2) and the
 GNU General Public License version 3 (GPLv3).

 You may use, distribute, and modify this file under the terms of either the MPLv2
 or GPLv3, at your option. If a copy of these licenses was not distributed with this
 file. You may obtain a copy of the licenses at https://www.mozilla.org/en-US/MPL/2.0/
 and https://www.gnu.org/licenses/gpl-3.0.en.html respectively.

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
