import { Field, InputType } from '@nestjs/graphql';
import { IsString, Length, Matches, MinLength } from 'class-validator';
import { PASSWORD_REGEX } from '../../common/constants/regex';

@InputType('PasswordsInput')
export abstract class PasswordsInput {
  @Field(() => String)
  @IsString()
  @Length(8, 35)
  @Matches(PASSWORD_REGEX, {
    message:
      'Password requires a lowercase letter, an uppercase letter, and a number or symbol',
  })
  public password1!: string;

  @Field(() => String)
  @IsString()
  @MinLength(1)
  public password2!: string;
}
