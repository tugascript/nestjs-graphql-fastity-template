import { ArgsType, Field } from '@nestjs/graphql';
import { PaginationDto } from './pagination.dto';
import { QueryOrderEnum } from '../enums/query-order.enum';
import { IsEnum } from 'class-validator';
import { QueryCursorEnum } from '../enums/query-cursor.enum';

@ArgsType()
export abstract class FilterDto extends PaginationDto {
  @Field(() => QueryCursorEnum, { defaultValue: QueryCursorEnum.DATE })
  @IsEnum(QueryCursorEnum)
  public cursor: QueryCursorEnum = QueryCursorEnum.DATE;

  @Field(() => QueryOrderEnum, { defaultValue: QueryOrderEnum.DESC })
  @IsEnum(QueryOrderEnum)
  public order: QueryOrderEnum = QueryOrderEnum.DESC;
}
