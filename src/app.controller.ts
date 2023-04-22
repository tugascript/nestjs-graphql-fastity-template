/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import { Controller, Get, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply } from 'fastify';

// Because of nginx
@Controller()
export class AppController {
  private readonly port: number;

  constructor(private readonly configService: ConfigService) {
    this.port = this.configService.get<number>('port');
  }

  @Get()
  public getInitialRoute(): string {
    return `Server running on ${this.port}`;
  }

  @Get('/favicon.ico')
  public getFavicon(@Res() res: FastifyReply): void {
    res.sendFile('/favicon.ico');
  }
}
