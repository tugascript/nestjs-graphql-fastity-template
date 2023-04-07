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
import { IsBoolean } from 'class-validator';

export abstract class ChangeTwoFactorDto {
  @ApiProperty({
    description: 'The state of the two factor authentication',
    type: Boolean,
  })
  @IsBoolean()
  public readonly twoFactor: boolean;
}
