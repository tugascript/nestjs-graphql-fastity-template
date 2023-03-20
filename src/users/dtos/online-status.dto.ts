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
import { IsEnum } from 'class-validator';
import { OnlineStatusEnum } from '../enums/online-status.enum';

@ArgsType()
export abstract class OnlineStatusDto {
  @Field(() => OnlineStatusEnum)
  @IsEnum(OnlineStatusEnum)
  public onlineStatus: OnlineStatusEnum;
}
