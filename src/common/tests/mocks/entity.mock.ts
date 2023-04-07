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

import { IsString, IsUUID, Length, Matches } from 'class-validator';
import { v4 } from 'uuid';
import { NAME_REGEX } from '../../constants/regex';

export class EntityMock {
  @IsString()
  @IsUUID(4)
  public id: string;

  @IsString()
  @Length(3, 100)
  @Matches(NAME_REGEX, {
    message: 'name must not have special characters',
  })
  public name: string;

  constructor(name: string) {
    this.id = v4();
    this.name = name;
  }
}
