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
