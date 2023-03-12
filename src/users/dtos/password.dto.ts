/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { ArgsType, Field } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@ArgsType()
export abstract class PasswordDto {
  @Field(() => String)
  @IsString()
  @MinLength(1)
  public password: string;
}
