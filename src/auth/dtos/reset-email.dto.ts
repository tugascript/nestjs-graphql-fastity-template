import { IsEmail, IsString } from 'class-validator';

export abstract class ResetEmailDto {
  @IsString()
  @IsEmail()
  public email: string;
}
