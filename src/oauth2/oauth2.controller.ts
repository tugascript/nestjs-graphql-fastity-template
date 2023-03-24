import { Controller } from '@nestjs/common';
import { Oauth2Service } from './oauth2.service';

@Controller('oauth2')
export class Oauth2Controller {
  constructor(private readonly oauth2Service: Oauth2Service) {}
}
