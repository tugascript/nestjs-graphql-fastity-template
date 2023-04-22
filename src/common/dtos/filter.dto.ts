/*
 This file is part of Nest GraphQL Fastify Template

 This project is dual-licensed under the Mozilla Public License 2.0 (MPLv2) and the
 GNU General Public License version 3 (GPLv3).

 You may use, distribute, and modify this file under the terms of either the MPLv2
 or GPLv3, at your option. If a copy of these licenses was not distributed with this
 file. You may obtain a copy of the licenses at https://www.mozilla.org/en-US/MPL/2.0/
 and https://www.gnu.org/licenses/gpl-3.0.en.html respectively.

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
