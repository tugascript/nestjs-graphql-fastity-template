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

import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches, MinLength } from 'class-validator';
import { PASSWORD_REGEX } from '../../common/constants/regex';

export abstract class PasswordsDto {
  @ApiProperty({
    description: 'New password',
    minLength: 8,
    maxLength: 35,
    type: String,
  })
  @IsString()
  @Length(8, 35)
  @Matches(PASSWORD_REGEX, {
    message:
      'Password requires a lowercase letter, an uppercase letter, and a number or symbol',
  })
  public password1!: string;

  @ApiProperty({
    description: 'Password confirmation',
    minLength: 1,
    type: String,
  })
  @IsString()
  @MinLength(1)
  public password2!: string;
}
