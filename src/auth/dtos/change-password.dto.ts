import { IsString, MinLength } from 'class-validator';
import { PasswordsDto } from './passwords.dto';

export abstract class ChangePasswordDto extends PasswordsDto {
  @IsString()
  @MinLength(1)
  public password!: string;
}
