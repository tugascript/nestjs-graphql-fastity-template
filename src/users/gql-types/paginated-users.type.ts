import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/gql-types/paginated.type';
import { UserType } from './user.type';

@ObjectType('PaginatedUsers')
export abstract class PaginatedUsersType extends Paginated(UserType) {}
