import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { LocalMessageType } from '../common/gql-types/message.type';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ChangeEmailDto } from './dtos/change-email.dto';
import { ChangePasswordDto } from './dtos/change-password.input';
import { ConfirmEmailDto } from './dtos/confirm-email.dto';
import { ConfirmLoginDto } from './dtos/confirm-login.dto';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { ResetEmailDto } from './dtos/reset-email.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { FastifyThrottlerGuard } from './guards/fastify-throttler.guard';

@Controller('api/auth')
@UseGuards(FastifyThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('/register')
  public async registerUser(
    @Body() registerDto: RegisterDto,
  ): Promise<LocalMessageType> {
    const message = await this.authService.registerUser(registerDto);
    return message;
  }

  @Public()
  @Post('/confirm-email')
  public async confirmEmail(
    @Res() res: FastifyReply,
    @Body() confirmEmailDto: ConfirmEmailDto,
  ): Promise<void> {
    const result = await this.authService.confirmEmail(res, confirmEmailDto);
    res.status(200).send(result);
  }

  @Public()
  @Post('/login')
  public async loginUser(
    @Res() res: FastifyReply,
    @Body() loginDto: LoginDto,
  ): Promise<void> {
    const result = await this.authService.loginUser(res, loginDto);
    res.status(200).send(result);
  }

  @Public()
  @Post('/confirm-login')
  public async confirmLogin(
    @Res() res: FastifyReply,
    @Body() confirmLoginDto: ConfirmLoginDto,
  ): Promise<void> {
    const result = await this.authService.confirmLogin(res, confirmLoginDto);
    res.status(200).send(result);
  }

  @Post('/confirm-credentials')
  public async confirmCredentials(
    @CurrentUser() userId: number,
  ): Promise<LocalMessageType> {
    return this.authService.confirmCredentials(userId);
  }

  @Post('/logout')
  public logoutUser(@Res() res: FastifyReply): void {
    const message = this.authService.logoutUser(res);
    res.status(200).send(message);
  }

  @Public()
  @Post('/refresh-access')
  public async refreshAccessToken(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const result = await this.authService.refreshAccessToken(req, res);
    res.status(200).send(result);
  }

  @Public()
  @Post('/reset-password-email')
  public async sendResetPasswordEmail(
    @Body() resetEmailDto: ResetEmailDto,
  ): Promise<LocalMessageType> {
    return this.authService.sendResetPasswordEmail(resetEmailDto);
  }

  @Public()
  @Post('/reset-password')
  public async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<LocalMessageType> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('/toogle-two-factor')
  public async changeTwoFactorAuth(
    @CurrentUser() userId: number,
  ): Promise<LocalMessageType> {
    return this.authService.changeTwoFactorAuth(userId);
  }

  @Post('/update-email')
  public async updateEmail(
    @Res() res: FastifyReply,
    @CurrentUser() userId: number,
    @Body() changeEmailDto: ChangeEmailDto,
  ): Promise<void> {
    const result = await this.authService.updateEmail(
      res,
      userId,
      changeEmailDto,
    );
    res.status(200).send(result);
  }

  @Post('/update-password')
  public async updatePassword(
    @Res() res: FastifyReply,
    @CurrentUser() userId: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const result = await this.authService.updatePassword(
      res,
      userId,
      changePasswordDto,
    );
    res.status(200).send(result);
  }
}
