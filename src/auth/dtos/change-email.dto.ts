import { ArgsType, Field } from '@nestjs/graphql';
import { IsEmail, MinLength } from 'class-validator';

@ArgsType()
export abstract class ChangeEmailDto {
  @Field(() => String)
  @IsEmail()
  public email!: string;

  @Field(() => String)
  @MinLength(1)
  public password!: string;
}
