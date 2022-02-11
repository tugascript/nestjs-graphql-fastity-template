import { ArgsType, Field } from '@nestjs/graphql';
import { IsJWT } from 'class-validator';

@ArgsType()
export abstract class ConfirmEmailDto {
  @Field(() => String)
  @IsJWT()
  public confirmationToken!: string;
}
