/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { LocalMessageType } from '../common/entities/gql/message.type';
import { isNull, isUndefined } from '../config/utils/validation.util';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Origin } from './decorators/origin.decorator';
import { Public } from './decorators/public.decorator';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ChangeTwoFactorDto } from './dtos/change-two-factor.dto';
import { ConfirmEmailDto } from './dtos/confirm-email.dto';
import { EmailDto } from './dtos/email.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { SignInDto } from './dtos/sign-in.dto';
import { SignUpDto } from './dtos/sign-up.dto';
import { FastifyThrottlerGuard } from './guards/fastify-throttler.guard';
import { AuthResponseMapper } from './mappers/auth-response.mapper';

@ApiTags('Auth')
@Controller('api/auth')
@UseGuards(FastifyThrottlerGuard)
export class AuthController {
  private readonly cookiePath = '/api/auth';
  private readonly cookieName: string;
  private readonly refreshTime: number;
  private readonly testing: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    this.cookieName = this.configService.get<string>('REFRESH_COOKIE');
    this.refreshTime = this.configService.get<number>('jwt.refresh.time');
    this.testing = this.configService.get<boolean>('testing');
  }

  @Public()
  @Post('/sign-up')
  @ApiCreatedResponse({
    type: LocalMessageType,
    description: 'The user has been created and is waiting confirmation',
  })
  @ApiConflictResponse({
    description: 'Email already in use',
  })
  @ApiBadRequestResponse({
    description: 'Something is invalid on the request body',
  })
  public async signUp(
    @Origin() origin: string | undefined,
    @Body() signUpDto: SignUpDto,
  ): Promise<LocalMessageType> {
    return await this.authService.signUp(signUpDto, origin);
  }

  @Public()
  @Post('/sign-in')
  @ApiOkResponse({
    type: AuthResponseMapper,
    description: 'Logs in the user and returns the access token',
  })
  @ApiBadRequestResponse({
    description: 'Something is invalid on the request body',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials or User is not confirmed',
  })
  public async signIn(
    @Res() res: FastifyReply,
    @Origin() origin: string | undefined,
    @Body() singInDto: SignInDto,
  ): Promise<void> {
    const result = await this.authService.signIn(singInDto, origin);

    if (result.title === 'message') {
      res.status(HttpStatus.OK).send(result.value);
      return;
    }

    this.saveRefreshCookie(res, result.value.refreshToken)
      .status(HttpStatus.OK)
      .send(AuthResponseMapper.map(result.value));
  }

  @Public()
  @Post('/refresh-access')
  @ApiOkResponse({
    type: AuthResponseMapper,
    description: 'Refreshes and returns the access token',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid token',
  })
  @ApiBadRequestResponse({
    description:
      'Something is invalid on the request body, or Token is invalid or expired',
  })
  public async refreshAccess(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const token = this.refreshTokenFromReq(req);
    const result = await this.authService.refreshTokenAccess(
      token,
      req.headers.origin,
    );
    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .send(AuthResponseMapper.map(result));
  }

  @Post('/logout')
  @ApiOkResponse({
    type: LocalMessageType,
    description: 'The user is logged out',
  })
  @ApiBadRequestResponse({
    description: 'Something is invalid on the request body',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid token',
  })
  public async logout(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const token = this.refreshTokenFromReq(req);
    const message = await this.authService.logout(token);
    res
      .clearCookie(this.cookieName, { path: this.cookiePath })
      .header('Content-Type', 'application/json')
      .status(HttpStatus.OK)
      .send(message);
  }

  @Public()
  @Post('/confirm-email')
  @ApiOkResponse({
    type: AuthResponseMapper,
    description: 'Confirms the user email and returns the access token',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid token',
  })
  @ApiBadRequestResponse({
    description:
      'Something is invalid on the request body, or Token is invalid or expired',
  })
  public async confirmEmail(
    @Origin() origin: string | undefined,
    @Body() confirmEmailDto: ConfirmEmailDto,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const result = await this.authService.confirmEmail(confirmEmailDto);
    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .send(AuthResponseMapper.map(result));
  }

  @Public()
  @Post('/forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: LocalMessageType,
    description:
      'An email has been sent to the user with the reset password link',
  })
  public async forgotPassword(
    @Origin() origin: string | undefined,
    @Body() emailDto: EmailDto,
  ): Promise<LocalMessageType> {
    return this.authService.resetPasswordEmail(emailDto, origin);
  }

  @Public()
  @Post('/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: LocalMessageType,
    description: 'The password has been reset',
  })
  @ApiBadRequestResponse({
    description:
      'Something is invalid on the request body, or Token is invalid or expired',
  })
  public async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<LocalMessageType> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Patch('/update-password')
  @ApiOkResponse({
    type: AuthResponseMapper,
    description: 'The password has been updated',
  })
  @ApiUnauthorizedResponse({
    description: 'The user is not logged in.',
  })
  public async updatePassword(
    @CurrentUser() userId: number,
    @Origin() origin: string | undefined,
    @Body() changePasswordDto: ChangePasswordDto,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const result = await this.authService.updatePassword(
      userId,
      changePasswordDto,
      origin,
    );
    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .send(AuthResponseMapper.map(result));
  }

  @Patch('/update-two-factor')
  @ApiOkResponse({
    type: AuthResponseMapper,
    description: 'The two factor has been updated',
  })
  @ApiUnauthorizedResponse({
    description: 'The user is not logged in.',
  })
  public async updateTwoFactor(
    @CurrentUser() userId: number,
    @Origin() origin: string | undefined,
    @Req() req: FastifyRequest,
    @Body() changeTwoFactorDto: ChangeTwoFactorDto,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const token = this.refreshTokenFromReq(req);
    const result = await this.authService.updateTwoFactor(
      userId,
      changeTwoFactorDto.twoFactor,
      token,
      origin,
    );
    this.saveRefreshCookie(res, result.refreshToken)
      .status(HttpStatus.OK)
      .send(AuthResponseMapper.map(result));
  }

  private refreshTokenFromReq(req: FastifyRequest): string {
    const token: string | undefined = req.cookies[this.cookieName];

    if (isUndefined(token) || isNull(token)) {
      throw new UnauthorizedException();
    }

    const { valid, value } = req.unsignCookie(token);

    if (!valid) {
      throw new UnauthorizedException();
    }

    return value;
  }

  private saveRefreshCookie(
    res: FastifyReply,
    refreshToken: string,
  ): FastifyReply {
    return res
      .cookie(this.cookieName, refreshToken, {
        secure: !this.testing,
        httpOnly: true,
        signed: true,
        path: this.cookiePath,
        expires: new Date(Date.now() + this.refreshTime * 1000),
      })
      .header('Content-Type', 'application/json');
  }
}
