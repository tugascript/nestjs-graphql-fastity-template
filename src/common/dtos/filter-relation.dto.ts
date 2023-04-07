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

import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { QueryOrderEnum } from '../enums/query-order.enum';

@ArgsType()
export abstract class FilterRelationDto {
  @Field(() => QueryOrderEnum, { defaultValue: QueryOrderEnum.ASC })
  @IsEnum(QueryOrderEnum)
  public order: QueryOrderEnum = QueryOrderEnum.ASC;

  @Field(() => Int, { defaultValue: 10 })
  @IsInt()
  @Min(1)
  @Max(50)
  public first = 10;
}
