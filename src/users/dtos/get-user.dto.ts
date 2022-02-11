import { ArgsType, Field } from '@nestjs/graphql';
import { IsString, Matches } from 'class-validator';
import { SLUG_REGEX } from '../../common/constants/regex';

@ArgsType()
export abstract class GetUserDto {
  @Field(() => String)
  @IsString()
  @Matches(SLUG_REGEX, {
    message: 'Username must be valid',
  })
  public username!: string;
}
