import { ObjectType } from '@nestjs/graphql';
import { Paginated } from '../../../common/entities/gql/paginated.type';
import { UserEntity } from '../user.entity';

@ObjectType('PaginatedUsers')
export abstract class PaginatedUsersType extends Paginated(UserEntity) {}
