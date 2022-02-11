import { registerEnumType } from '@nestjs/graphql';
import { UserEntity } from '../entities/user.entity';

export enum UsersCursorEnum {
  DATE = 'DATE',
  ALPHABET = 'ALPHABET',
}

export const getUserCursor = (val: UsersCursorEnum): keyof UserEntity =>
  val === UsersCursorEnum.ALPHABET ? 'username' : 'id';

registerEnumType(UsersCursorEnum, {
  name: 'UsersCursor',
});
