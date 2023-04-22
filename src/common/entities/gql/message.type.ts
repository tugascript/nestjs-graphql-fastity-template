/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

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
