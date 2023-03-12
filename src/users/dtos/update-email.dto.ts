/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { ArgsType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, Length } from 'class-validator';
import { PasswordDto } from './password.dto';

@ArgsType()
export abstract class UpdateEmailDto extends PasswordDto {
  @Field(() => String)
  @IsString()
  @IsEmail()
  @Length(5, 255)
  public email: string;
}
