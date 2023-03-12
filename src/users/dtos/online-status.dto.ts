/*
  Free and Open Source - MIT
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
