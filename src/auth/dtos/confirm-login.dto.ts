import { ArgsType, Field } from '@nestjs/graphql';
import { IsEmail, IsNumberString, Length } from 'class-validator';

@ArgsType()
export abstract class ConfirmLoginDto {
  @Field(() => String)
  @IsEmail()
  public email: string;

  @Field(() => String)
  @IsNumberString()
  @Length(6, 6, { message: 'Access code has to be 6 character long' })
  public accessCode: string;
}
