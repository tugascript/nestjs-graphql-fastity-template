import { ArgsType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsJWT, ValidateNested } from 'class-validator';
import { PasswordsInput } from '../inputs/passwords.input';

@ArgsType()
export abstract class ResetPasswordDto {
  @Field(() => String)
  @IsJWT()
  public resetToken!: string;

  @Field(() => PasswordsInput)
  @ValidateNested()
  @Type(() => PasswordsInput)
  public passwords!: PasswordsInput;
}
