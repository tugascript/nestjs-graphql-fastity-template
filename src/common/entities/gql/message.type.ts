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
