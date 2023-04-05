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
import { SocialAuthController } from './social-auth.controller';

describe('SocialAuthController', () => {
  let controller: SocialAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialAuthController],
    }).compile();

    controller = module.get<SocialAuthController>(SocialAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
