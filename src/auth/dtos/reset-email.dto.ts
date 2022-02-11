import { ArgsType, Field } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';

@ArgsType()
export abstract class ResetEmailDto {
  @Field(() => String)
  @IsEmail()
  public email: string;
}
