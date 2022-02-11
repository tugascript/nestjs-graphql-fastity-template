import { ParseBoolPipe } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Response } from 'express';
import { LocalMessageType } from '../common/gql-types/message.type';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { GetRes } from './decorators/get-res.decorator';
import { Public } from './decorators/public.decorator';
import { ChangeEmailDto } from './dtos/change-email.dto';
import { ChangePasswordDto } from './dtos/change-password.input';
import { ConfirmEmailDto } from './dtos/confirm-email.dto';
import { ConfirmLoginDto } from './dtos/confirm-login.dto';
import { ResetEmailDto } from './dtos/reset-email.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { AuthUnion } from './gql-types/auth-union.type';
import { AuthType } from './gql-types/auth.type';
import { LoginInput } from './inputs/login.input';
import { RegisterInput } from './inputs/register.input';

@Resolver(() => AuthType)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Mutation(() => LocalMessageType)
  public async registerUser(
    @Args('input') input: RegisterInput,
  ): Promise<LocalMessageType> {
    return this.authService.registerUser(input);
  }

  @Public()
  @Mutation(() => AuthType)
  public async confirmEmail(
    @GetRes() res: Response,
    @Args() dto: ConfirmEmailDto,
  ): Promise<AuthType> {
    return this.authService.confirmEmail(res, dto);
  }

  @Public()
  @Mutation(() => AuthUnion)
  public async loginUser(
    @GetRes() res: Response,
    @Args('input') input: LoginInput,
  ): Promise<AuthType | LocalMessageType> {
    return this.authService.loginUser(res, input);
  }

  @Public()
  @Mutation(() => AuthType)
  public async confirmUserLogin(
    @GetRes() res: Response,
    @Args() dto: ConfirmLoginDto,
  ): Promise<AuthType> {
    return this.authService.confirmLogin(res, dto);
  }

  @Mutation(() => LocalMessageType)
  public async logoutUser(@GetRes() res: Response): Promise<LocalMessageType> {
    return this.authService.logoutUser(res);
  }

  @Public()
  @Mutation(() => LocalMessageType)
  public async sendResetPasswordEmail(
    @Args() dto: ResetEmailDto,
  ): Promise<LocalMessageType> {
    return this.authService.sendResetPasswordEmail(dto);
  }

  @Public()
  @Mutation(() => LocalMessageType)
  public async resetPassword(
    @Args() dto: ResetPasswordDto,
  ): Promise<LocalMessageType> {
    return this.authService.resetPassword(dto);
  }

  @Mutation(() => LocalMessageType)
  public async changeTwoFactorAuthentication(
    @CurrentUser() userId: number,
    @Args('activate', ParseBoolPipe) activate: boolean,
  ) {
    return this.authService.changeTwoFactorAuth(userId, activate);
  }

  @Mutation(() => AuthType)
  public async updateEmail(
    @GetRes() res: Response,
    @CurrentUser() userId: number,
    @Args() dto: ChangeEmailDto,
  ): Promise<AuthType> {
    return this.authService.updateEmail(res, userId, dto);
  }

  @Mutation(() => AuthType)
  public async updatePassword(
    @GetRes() res: Response,
    @CurrentUser() userId: number,
    @Args() dto: ChangePasswordDto,
  ): Promise<AuthType> {
    return this.authService.updatePassword(res, userId, dto);
  }

  @Mutation(() => LocalMessageType)
  public async confirmCredentials(
    @CurrentUser() userId: number,
  ): Promise<LocalMessageType> {
    return this.authService.confirmCredentials(userId);
  }
}
