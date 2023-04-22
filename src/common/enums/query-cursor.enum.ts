/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import { registerEnumType } from '@nestjs/graphql';
import { IUser } from '../../users/interfaces/user.interface';

export enum QueryCursorEnum {
  DATE = 'DATE',
  ALPHA = 'ALPHA',
}

registerEnumType(QueryCursorEnum, {
  name: 'QueryCursor',
});

export const getQueryCursor = (cursor: QueryCursorEnum): string =>
  cursor === QueryCursorEnum.DATE ? 'id' : 'slug';

export const getUserQueryCursor = (cursor: QueryCursorEnum): keyof IUser =>
  cursor === QueryCursorEnum.DATE ? 'id' : 'username';
