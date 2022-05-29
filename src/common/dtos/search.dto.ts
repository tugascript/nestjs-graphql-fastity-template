import { ArgsType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { NAME_REGEX } from '../constants/regex';
import { FilterDto } from './filter.dto';

@ArgsType()
export abstract class SearchDto extends FilterDto {
  @Field(() => String, { nullable: true })
  @IsString()
  @Length(1, 100, {
    message: 'Search needs to be between 1 and 100 characters',
  })
  @Matches(NAME_REGEX, {
    message: 'Search can only contain letters, numbers and spaces',
  })
  @IsOptional()
  public search?: string;
}
