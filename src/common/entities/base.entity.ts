/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IBase } from '../interfaces/base.interface';

@ObjectType({ isAbstract: true })
@Entity({ abstract: true })
export abstract class LocalBaseEntity implements IBase {
  @Field(() => Int)
  @PrimaryKey()
  public id: number;

  @Field(() => String)
  @Property({ onCreate: () => new Date() })
  public createdAt: Date = new Date();

  @Field(() => String)
  @Property({ onUpdate: () => new Date() })
  public updatedAt: Date = new Date();
}
