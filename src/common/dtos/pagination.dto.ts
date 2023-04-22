/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import { ArgsType, Field, Int } from '@nestjs/graphql';
import {
  IsBase64,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

@ArgsType()
export class PaginationDto {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsBase64()
  @IsOptional()
  public after?: string;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  @Max(50)
  public first = 10;
}
