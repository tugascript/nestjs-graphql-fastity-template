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
