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
import { Oauth2Service } from '../oauth2.service';

describe('Oauth2Service', () => {
  let service: Oauth2Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Oauth2Service],
    }).compile();

    service = module.get<Oauth2Service>(Oauth2Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
