/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

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
