/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { IsJWT, IsString } from 'class-validator';
import { PasswordsDto } from './passwords.dto';

export abstract class ResetPasswordDto extends PasswordsDto {
  @IsString()
  @IsJWT()
  public resetToken!: string;
}
