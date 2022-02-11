import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../common/gql-types/paginated.type';
import { UserEntity } from '../entities/user.entity';

@ObjectType('PaginatedUsers')
export abstract class PaginatedUsersType extends Paginated(UserEntity) {}
