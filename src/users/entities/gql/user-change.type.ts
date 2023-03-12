/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { ObjectType } from '@nestjs/graphql';
import { Change } from '../../../common/entities/gql/change.type';
import { UserEntity } from '../user.entity';

@ObjectType('UserChange')
export abstract class UserChangeType extends Change<UserEntity>(UserEntity) {}
