/*
  Free and Open Source - MIT
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
  public getInitialRoute() {
    return `Server running on ${this.port}`;
  }

  @Get('/favicon.ico')
  public getFavicon(@Res() res: FastifyReply) {
    res.sendFile('/favicon.ico');
  }
}
