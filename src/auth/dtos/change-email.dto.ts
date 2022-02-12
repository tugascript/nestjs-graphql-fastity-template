import { IsEmail, IsString, MinLength } from 'class-validator';

export abstract class ChangeEmailDto {
  @IsString()
  @IsEmail()
  public email!: string;

  @IsString()
  @MinLength(1)
  public password!: string;
}
