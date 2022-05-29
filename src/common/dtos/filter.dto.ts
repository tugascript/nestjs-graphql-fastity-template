import { ArgsType, Field } from '@nestjs/graphql';
import { PaginationDto } from './pagination.dto';
import { QueryOrderEnum } from '../enums/query-order.enum';
import { IsEnum } from 'class-validator';

@ArgsType()
export abstract class FilterDto extends PaginationDto {
  @Field(() => QueryOrderEnum, { defaultValue: QueryOrderEnum.DESC })
  @IsEnum(QueryOrderEnum)
  public order: QueryOrderEnum;
}
