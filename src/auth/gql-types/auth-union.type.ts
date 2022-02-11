import { createUnionType } from '@nestjs/graphql';
import { LocalMessageType } from '../../common/gql-types/message.type';
import { AuthType } from './auth.type';

export const AuthUnion = createUnionType({
  name: 'AuthUnion',
  types: () => [AuthType, LocalMessageType],
  resolveType(value) {
    if (value instanceof AuthType) return AuthType;
    if (value instanceof LocalMessageType) return LocalMessageType;
    return null;
  },
});
