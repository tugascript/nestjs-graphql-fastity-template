import { IsJWT, IsString } from 'class-validator';

export abstract class ConfirmEmailDto {
  @IsString()
  @IsJWT()
  public confirmationToken!: string;
}
