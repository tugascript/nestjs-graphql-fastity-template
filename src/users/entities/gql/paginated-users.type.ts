/*
  Free and Open Source - MIT
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
