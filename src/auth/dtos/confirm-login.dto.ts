import { IsEmail, IsNumberString, IsString, Length } from 'class-validator';

export abstract class ConfirmLoginDto {
  @IsString()
  @IsEmail()
  public email: string;

  @IsString()
  @IsNumberString()
  @Length(6, 6, { message: 'Access code has to be 6 character long' })
  public accessCode: string;
}
