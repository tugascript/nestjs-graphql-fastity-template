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
