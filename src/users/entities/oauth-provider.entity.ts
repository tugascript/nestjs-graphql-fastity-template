/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import {
  Entity,
  Enum,
  ManyToOne,
  PrimaryKeyType,
  Property,
  Unique,
} from '@mikro-orm/core';
import { IsEnum } from 'class-validator';
import { OAuthProvidersEnum } from '../enums/oauth-providers.enum';
import { IOAuthProvider } from '../interfaces/oauth-provider.interface';
import { UserEntity } from './user.entity';

@Entity({ tableName: 'oauth_providers' })
@Unique({ properties: ['provider', 'user'] })
export class OAuthProviderEntity implements IOAuthProvider {
  @Enum({
    items: () => OAuthProvidersEnum,
    primary: true,
    columnType: 'varchar',
    length: 9,
  })
  @IsEnum(OAuthProvidersEnum)
  public readonly provider: OAuthProvidersEnum;

  @ManyToOne({
    entity: () => UserEntity,
    primary: true,
    onDelete: 'cascade',
  })
  public readonly user: UserEntity;

  @Property({ onCreate: () => new Date() })
  public readonly createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  public readonly updatedAt: Date = new Date();

  [PrimaryKeyType]?: [OAuthProvidersEnum, number];
}
