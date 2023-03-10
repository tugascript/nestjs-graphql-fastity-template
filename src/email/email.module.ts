/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
