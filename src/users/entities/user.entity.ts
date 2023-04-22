/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import {
  Collection,
  Embedded,
  Entity,
  Enum,
  OneToMany,
  Property,
} from '@mikro-orm/core';
import { Field, ObjectType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  NAME_REGEX,
  SLUG_REGEX,
  UNSET_BCRYPT_HASH,
} from '../../common/constants/regex';
import { LocalBaseEntity } from '../../common/entities/base.entity';
import { CredentialsEmbeddable } from '../embeddables/credentials.embeddable';
import { OnlineStatusEnum } from '../enums/online-status.enum';
import { IUser } from '../interfaces/user.interface';
import { OAuthProviderEntity } from './oauth-provider.entity';

@ObjectType('User')
@Entity({ tableName: 'users' })
export class UserEntity extends LocalBaseEntity implements IUser {
  @Field(() => String)
  @Property({ columnType: 'varchar', length: 100 })
  @IsString()
  @Length(3, 100)
  @Matches(NAME_REGEX, {
    message: 'Name must not have special characters',
  })
  public name: string;

  @Field(() => String)
  @Property({ columnType: 'varchar', length: 106 })
  @IsString()
  @Length(3, 106)
  @Matches(SLUG_REGEX, {
    message: 'Username must be a valid slugs',
  })
  public username: string;

  @Field(() => String, { nullable: true })
  @Property({ columnType: 'varchar', length: 250 })
  @IsString()
  @Length(5, 250)
  @IsEmail()
  public email: string;

  @Field(() => String, { nullable: true })
  @Property({ columnType: 'varchar', length: 250, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  @IsUrl()
  public picture?: string;

  @Field(() => OnlineStatusEnum)
  @Enum({
    items: () => OnlineStatusEnum,
    default: OnlineStatusEnum.OFFLINE,
    columnType: 'varchar',
    length: 9,
  })
  @IsEnum(OnlineStatusEnum)
  public onlineStatus: OnlineStatusEnum = OnlineStatusEnum.OFFLINE;

  @Field(() => OnlineStatusEnum, { nullable: true })
  @Enum({
    items: () => OnlineStatusEnum,
    default: OnlineStatusEnum.ONLINE,
    columnType: 'varchar',
    length: 9,
  })
  @IsEnum(OnlineStatusEnum)
  public defaultStatus: OnlineStatusEnum = OnlineStatusEnum.ONLINE;

  @Property({ columnType: 'varchar', length: 60 })
  @IsString()
  @Length(5, 60)
  @Matches(UNSET_BCRYPT_HASH)
  public password: string;

  @Property({ columnType: 'boolean', default: false })
  @IsBoolean()
  public confirmed: true | false = false;

  @Property({ columnType: 'boolean', default: false })
  @IsBoolean()
  public twoFactor: true | false = false;

  @Embedded(() => CredentialsEmbeddable)
  public credentials: CredentialsEmbeddable = new CredentialsEmbeddable();

  @Property()
  @IsDate()
  public lastLogin: Date = new Date();

  @Field(() => String)
  @Property()
  @IsDate()
  public lastOnline: Date = new Date();

  @OneToMany(() => OAuthProviderEntity, (oauth) => oauth.user)
  public oauthProviders = new Collection<OAuthProviderEntity, UserEntity>(this);
}
