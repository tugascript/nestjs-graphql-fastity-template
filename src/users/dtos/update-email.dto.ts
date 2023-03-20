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
