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
