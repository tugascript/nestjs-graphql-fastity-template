/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { ArgsType, Field } from '@nestjs/graphql';
import { IsString, Length, Matches } from 'class-validator';
import { SLUG_REGEX } from '../../common/constants/regex';

@ArgsType()
export abstract class UsernameDto {
  @Field(() => String)
  @IsString()
  @Length(3, 106)
  @Matches(SLUG_REGEX, {
    message: 'Username must be a valid slugs',
  })
  public username: string;
}
