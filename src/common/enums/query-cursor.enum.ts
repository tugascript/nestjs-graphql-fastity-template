import { registerEnumType } from '@nestjs/graphql';
import { IUser } from '../../users/interfaces/user.interface';

export enum QueryCursorEnum {
  DATE = 'DATE',
  ALPHA = 'ALPHA',
}

registerEnumType(QueryCursorEnum, {
  name: 'QueryCursor',
});

export const getQueryCursor = (cursor: QueryCursorEnum): string =>
  cursor === QueryCursorEnum.ALPHA ? 'id' : 'slug';

export const getUserQueryCursor = (cursor: QueryCursorEnum): keyof IUser =>
  cursor === QueryCursorEnum.ALPHA ? 'id' : 'username';
