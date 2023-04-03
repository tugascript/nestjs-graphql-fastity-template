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

import {
  Entity,
  Enum,
  ManyToOne,
  PrimaryKeyType,
  Property,
  Unique,
} from '@mikro-orm/core';
import { OAuthProvidersEnum } from '../enums/oauth-providers.enum';
import { IsEnum } from 'class-validator';
import { UserEntity } from '../../users/entities/user.entity';
import { IOAuthProvider } from '../interfaces/oauth-provider.interface';

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
  public provider: OAuthProvidersEnum;

  @ManyToOne({
    entity: () => UserEntity,
    primary: true,
  })
  public user: UserEntity;

  @Property({ onCreate: () => new Date() })
  public createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  public updatedAt: Date = new Date();

  [PrimaryKeyType]?: [OAuthProvidersEnum, number];
}