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
import { IsString, MinLength } from 'class-validator';
import { PasswordsDto } from './passwords.dto';

export abstract class ChangePasswordDto extends PasswordsDto {
  @ApiProperty({
    description: 'The current password',
    minLength: 1,
    type: String,
  })
  @IsString()
  @MinLength(1)
  public password!: string;
}
