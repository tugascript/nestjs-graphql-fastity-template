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

import { MikroORM } from '@mikro-orm/core';
import {
  Injectable,
  Logger,
  LoggerService,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private readonly loggerService: LoggerService;
  private readonly testing: boolean;

  constructor(
    private readonly orm: MikroORM,
    private readonly configService: ConfigService,
  ) {
    this.loggerService = new Logger(AppService.name);
    this.testing = this.configService.get('testing');
  }

  public async onModuleInit(): Promise<void> {
    if (this.testing) {
      this.loggerService.log('Started generating schema');
      await this.orm.getSchemaGenerator().createSchema();
      this.loggerService.log('Finished generating schema');
    }
  }

  public async onModuleDestroy(): Promise<void> {
    if (this.testing) {
      this.loggerService.log('Started dropping schema');
      await this.orm.getSchemaGenerator().dropSchema();
      this.loggerService.log('Finished dropping schema');
    }

    this.loggerService.log('Closing database connection');
    await this.orm.close();
    this.loggerService.log('Closed database connection');
  }
}
