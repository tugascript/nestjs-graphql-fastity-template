/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import { ArgsType, Field } from '@nestjs/graphql';
import { PaginationDto } from './pagination.dto';
import { QueryOrderEnum } from '../enums/query-order.enum';
import { IsEnum } from 'class-validator';
import { QueryCursorEnum } from '../enums/query-cursor.enum';

@ArgsType()
export abstract class FilterDto extends PaginationDto {
  @Field(() => QueryCursorEnum, { defaultValue: QueryCursorEnum.DATE })
  @IsEnum(QueryCursorEnum)
  public cursor: QueryCursorEnum = QueryCursorEnum.DATE;

  @Field(() => QueryOrderEnum, { defaultValue: QueryOrderEnum.DESC })
  @IsEnum(QueryOrderEnum)
  public order: QueryOrderEnum = QueryOrderEnum.DESC;
}
