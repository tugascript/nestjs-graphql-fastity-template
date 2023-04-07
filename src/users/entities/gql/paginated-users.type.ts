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

import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../../common/entities/gql/paginated.type';
import { UserEntity } from '../user.entity';

@ObjectType('PaginatedUsers')
export abstract class PaginatedUsersType extends Paginated<UserEntity>(
  UserEntity,
) {}
