import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { LocalMessageType } from '../common/gql-types/message.type';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { ConfirmEmailDto } from './dtos/confirm-email.dto';
import { RegisterDto } from './dtos/register.dto';

@Controller('api/auth')
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
    @Body() confirmEmailDto: ConfirmEmailDto,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const accessToken = await this.authService.confirmEmail(
      res,
      confirmEmailDto,
    );
    res.status(200).send({
      accessToken,
    });
  }

  @Public()
  @Post('/refresh-access')
  public async refreshAccessToken(
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ): Promise<void> {
    const accessToken = await this.authService.refreshAccessToken(req, res);
    res.status(200).send({
      accessToken,
    });
  }
}
