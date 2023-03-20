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

export enum OnlineStatusEnum {
  ONLINE = 'ONLINE',
  BUSY = 'BUSY',
  IDLE = 'IDLE',
  DO_NOT_DISTURB = 'DO_NOT_DISTURB',
  INVISIBLE = 'INVISIBLE',
  OFFLINE = 'OFFLINE',
}

registerEnumType(OnlineStatusEnum, { name: 'OnlineStatus' });
