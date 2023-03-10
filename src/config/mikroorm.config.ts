/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import {
  MikroOrmModuleOptions,
  MikroOrmOptionsFactory,
} from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MikroOrmConfig implements MikroOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createMikroOrmOptions(): MikroOrmModuleOptions {
    return this.configService.get<MikroOrmModuleOptions>('db');
  }
}
