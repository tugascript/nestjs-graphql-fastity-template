import { ArgsType, Field, Int } from '@nestjs/graphql';
import {
  IsBase64,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

@ArgsType()
export class PaginationDto {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsBase64()
  @IsOptional()
  public after?: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(50)
  public first = 10;
}
