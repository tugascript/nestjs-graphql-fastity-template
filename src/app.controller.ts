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
