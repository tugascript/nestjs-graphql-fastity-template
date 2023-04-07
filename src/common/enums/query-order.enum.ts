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

import { registerEnumType } from '@nestjs/graphql';

export type tOrderEnum = '$gt' | '$lt';
export type tOppositeOrder = '$gte' | '$lte';
export enum QueryOrderEnum {
  ASC = 'ASC',
  DESC = 'DESC',
}

export const getQueryOrder = (order: QueryOrderEnum): tOrderEnum =>
  order === QueryOrderEnum.ASC ? '$gt' : '$lt';

export const getOppositeOrder = (order: QueryOrderEnum): tOppositeOrder =>
  order === QueryOrderEnum.ASC ? '$lte' : '$gte';

registerEnumType(QueryOrderEnum, {
  name: 'QueryOrder',
});
