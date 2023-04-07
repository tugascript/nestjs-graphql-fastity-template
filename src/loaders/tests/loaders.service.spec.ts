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

import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { CommonModule } from '../../common/common.module';
import { config } from '../../config';
import { MikroOrmConfig } from '../../config/mikroorm.config';
import { validationSchema } from '../../config/validation.config';
import { LoadersService } from '../loaders.service';

describe('LoadersService', () => {
  let service: LoadersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validationSchema,
          load: [config],
        }),
        MikroOrmModule.forRootAsync({
          imports: [ConfigModule],
          useClass: MikroOrmConfig,
        }),
        CommonModule,
      ],
      providers: [
        LoadersService,
        {
          provide: 'CommonModule',
          useClass: CommonModule,
        },
      ],
    }).compile();

    service = module.get<LoadersService>(LoadersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
