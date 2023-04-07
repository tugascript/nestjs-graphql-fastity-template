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

import { Test, TestingModule } from '@nestjs/testing';
import { Oauth2Controller } from '../oauth2.controller';
import { Oauth2Service } from '../oauth2.service';

describe('Oauth2Controller', () => {
  let controller: Oauth2Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [Oauth2Controller],
      providers: [Oauth2Service],
    }).compile();

    controller = module.get<Oauth2Controller>(Oauth2Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
