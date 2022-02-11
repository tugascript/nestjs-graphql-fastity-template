import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@InputType('LoginInput')
export abstract class LoginInput {
  @Field(() => String)
  @IsEmail()
  public email: string;

  @Field(() => String)
  @IsString()
  @MinLength(1)
  public password: string;
}
