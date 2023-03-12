/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { registerEnumType } from '@nestjs/graphql';

export enum ChangeTypeEnum {
  NEW = 'NEW',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

registerEnumType(ChangeTypeEnum, {
  name: 'ChangeType',
});
