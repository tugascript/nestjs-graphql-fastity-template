/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import Handlebars from 'handlebars';
import { createTransport, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { join } from 'path';
import { IEmailConfig } from '../config/interfaces/email-config.interface';
import { IUser } from '../users/interfaces/user.interface';
import { ITemplates } from './interfaces/templates.interface';

@Injectable()
export class EmailService {
  private readonly loggerService: LoggerService;
  private readonly transport: Transporter<SMTPTransport.SentMessageInfo>;
  private readonly email: string;
  private readonly domain: string;
  private readonly templates: ITemplates;

  constructor(private readonly configService: ConfigService) {
    const emailConfig = this.configService.get<IEmailConfig>('emailService');
    this.transport = createTransport(emailConfig);
    this.email = `"My App" <${emailConfig.auth.user}>`;
    this.domain = this.configService.get<string>('domain');
    this.loggerService = new Logger(EmailService.name);
    this.templates = {
      confirmation: EmailService.parseTemplate('confirmation.hbs'),
      resetPassword: EmailService.parseTemplate('reset-password.hbs'),
      loginConfirmation: EmailService.parseTemplate('login-confirmation.hbs'),
    };
  }

  private static parseTemplate<T>(
    templateName: string,
  ): Handlebars.TemplateDelegate<T> {
    const templateText = readFileSync(
      join(__dirname, 'templates', templateName),
      'utf-8',
    );
    return Handlebars.compile<T>(templateText, { strict: true });
  }

  public sendConfirmationEmail(user: IUser, token: string): void {
    const { email, name } = user;
    this.sendEmail(
      email,
      'Confirm your email',
      this.templates.confirmation({
        name,
        link: `https://${this.domain}/auth/confirm/${token}`,
      }),
      'A new confirmation email was sent.',
    );
  }

  public sendResetPasswordEmail(user: IUser, token: string): void {
    const { email, name } = user;
    const subject = 'Reset your password';
    this.sendEmail(
      email,
      subject,
      this.templates.resetPassword({
        name,
        link: `https://${this.domain}/auth/reset-password/${token}`,
      }),
      'A new reset password email was sent.',
    );
  }

  public sendAccessCode(user: IUser, code: string): void {
    const { email, name } = user;
    this.sendEmail(
      email,
      `Your access code ${name}`,
      this.templates.loginConfirmation({
        name,
        code,
      }),
      'A new access code was sent.',
    );
  }

  public sendEmail(
    to: string,
    subject: string,
    html: string,
    log?: string,
  ): void {
    this.transport
      .sendMail({
        from: this.email,
        to,
        subject,
        html,
      })
      .then(() => this.loggerService.log(log ?? 'A new email was sent.'))
      .catch((error) => this.loggerService.error(error));
  }
}
