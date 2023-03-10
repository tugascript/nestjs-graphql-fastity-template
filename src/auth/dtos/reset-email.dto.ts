/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { IsEmail, IsString } from 'class-validator';

export abstract class ResetEmailDto {
  @IsString()
  @IsEmail()
  public email: string;
}
