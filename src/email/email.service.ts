import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { IEmailConfig } from '../config/interfaces/email-config.interface';
import { UserEntity } from '../users/entities/user.entity';
import { confirmationEmail } from './templates/confirmation';
import { loginConfirmationEmail } from './templates/login-confirmation';
import { passwordResetEmail } from './templates/password-reset';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  private readonly transport = createTransport(
    this.configService.get<IEmailConfig>('emailService'),
  );
  private readonly email = `"Your App" <${this.configService.get<string>(
    'EMAIL_USER',
  )}>`;

  public async sendConfirmationEmail(
    { name, email }: UserEntity,
    url: string,
  ): Promise<void> {
    await this.sendEmail(
      email,
      `Confirm your email ${name}`,
      confirmationEmail(name, url),
    );
  }

  public async sendPasswordResetEmail(
    { name, email }: UserEntity,
    url: string,
  ): Promise<void> {
    await this.sendEmail(
      email,
      `Reset your password ${name}`,
      passwordResetEmail(name, url),
    );
  }

  public async sendAccessCode(
    { email, name }: UserEntity,
    accessCode: string,
  ): Promise<void> {
    await this.sendEmail(
      email,
      `Your access code ${name}`,
      loginConfirmationEmail(name, accessCode),
    );
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    await this.transport.sendMail({
      from: this.email,
      subject,
      to,
      html,
    });
  }
}
