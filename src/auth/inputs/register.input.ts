import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';
import { NAME_REGEX, PASSWORD_REGEX } from '../../common/constants/regex';

@InputType('RegisterInput')
export abstract class RegisterInput {
  @Field(() => String)
  @IsString()
  @Length(3, 100, {
    message: 'Name has to be between 3 and 50 characters.',
  })
  @Matches(NAME_REGEX, {
    message: 'Name can only contain letters, dots, numbers and spaces.',
  })
  public name!: string;

  @Field(() => String)
  @IsEmail()
  public email!: string;

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
