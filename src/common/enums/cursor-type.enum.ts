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

import { QueryCursorEnum } from './query-cursor.enum';

export enum CursorTypeEnum {
  DATE = 'DATE',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
}

export const getCursorType = (cursor: QueryCursorEnum) =>
  cursor === QueryCursorEnum.DATE
    ? CursorTypeEnum.NUMBER
    : CursorTypeEnum.STRING;
