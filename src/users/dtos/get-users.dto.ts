import { ArgsType, Field } from '@nestjs/graphql';
import { IsEnum, IsString, Matches } from 'class-validator';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { NAME_REGEX } from '../../common/constants/regex';
import { QueryOrderEnum } from '../../common/enums/query-order.enum';
import { UsersCursorEnum } from '../enums/users-cursor.enum';

@ArgsType()
export abstract class GetUsersDto extends PaginationDto {
  @Field(() => String)
  @IsString()
  @Matches(NAME_REGEX, {
    message: 'Search can only contain letters, dots, numbers and spaces.',
  })
  public search!: string;

  @Field(() => UsersCursorEnum, { defaultValue: UsersCursorEnum.DATE })
  @IsEnum(UsersCursorEnum)
  public cursor: UsersCursorEnum = UsersCursorEnum.DATE;

  @Field(() => QueryOrderEnum, { defaultValue: QueryOrderEnum.DESC })
  @IsEnum(QueryOrderEnum)
  public order: QueryOrderEnum = QueryOrderEnum.DESC;
}
