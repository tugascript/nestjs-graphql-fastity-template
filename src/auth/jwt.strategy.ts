import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import * as dayjs from 'dayjs';
import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt';
import { AuthService } from './auth.service';
import { IAccessPayloadResponse } from './interfaces/access-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.access.secret'),
      passReqToCallback: false,
    });
  }

  private readonly accessTime =
    this.configService.get<number>('jwt.access.time');

  public async validate(
    { id, sessionId, iat }: IAccessPayloadResponse,
    done: VerifiedCallback,
  ): Promise<void> {
    if (sessionId && dayjs().unix() - iat > this.accessTime)
      await this.authService.refreshUserSession(id, sessionId);

    return done(null, id, iat);
  }
}
