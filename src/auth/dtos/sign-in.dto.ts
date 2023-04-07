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
import { IsString, Length, MinLength } from 'class-validator';

export abstract class SignInDto {
  @ApiProperty({
    description: 'Username or email',
    examples: ['john.doe', 'john.doe@gmail.com'],
    minLength: 3,
    maxLength: 255,
    type: String,
  })
  @IsString()
  @Length(3, 255)
  public emailOrUsername: string;

  @ApiProperty({
    description: "User's password",
    minLength: 1,
    type: String,
  })
  @IsString()
  @MinLength(1)
  public password: string;
}
