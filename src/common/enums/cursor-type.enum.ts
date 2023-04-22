/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import { QueryCursorEnum } from './query-cursor.enum';

export enum CursorTypeEnum {
  DATE = 'DATE',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
}

export const getCursorType = (cursor: QueryCursorEnum): CursorTypeEnum =>
  cursor === QueryCursorEnum.DATE
    ? CursorTypeEnum.NUMBER
    : CursorTypeEnum.STRING;
