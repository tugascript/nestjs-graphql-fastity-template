import { ArgsType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsString, MinLength, ValidateNested } from 'class-validator';
import { PasswordsInput } from '../inputs/passwords.input';

@ArgsType()
export abstract class ChangePasswordDto {
  @Field(() => String)
  @IsString()
  @MinLength(1)
  public password!: string;

  @Field(() => PasswordsInput)
  @ValidateNested()
  @Type(() => PasswordsInput)
  public newPasswords!: PasswordsInput;
}
