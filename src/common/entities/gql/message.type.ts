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

import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { v4 as uuidV4 } from 'uuid';

@ObjectType('Message')
export class LocalMessageType {
  @ApiProperty({
    description: 'Message UUID',
    example: 'c0a80121-7ac0-11d1-898c-00c04fd8d5cd',
    type: String,
  })
  @Field(() => ID)
  public id!: string;

  @ApiProperty({
    description: 'Message',
    example: 'Hello World',
    type: String,
  })
  @Field(() => String)
  public message!: string;

  constructor(message: string) {
    this.id = uuidV4();
    this.message = message;
  }
}
