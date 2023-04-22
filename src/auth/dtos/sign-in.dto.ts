/*
 This file is part of Nest GraphQL Fastify Template

 This project is dual-licensed under the Mozilla Public License 2.0 (MPLv2) and the
 GNU General Public License version 3 (GPLv3).

 You may use, distribute, and modify this file under the terms of either the MPLv2
 or GPLv3, at your option. If a copy of these licenses was not distributed with this
 file. You may obtain a copy of the licenses at https://www.mozilla.org/en-US/MPL/2.0/
 and https://www.gnu.org/licenses/gpl-3.0.en.html respectively.

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
