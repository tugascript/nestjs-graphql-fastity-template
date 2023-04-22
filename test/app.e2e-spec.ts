/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import { faker } from '@faker-js/faker';
import fastifyCookie from '@fastify/cookie';
import { MikroORM } from '@mikro-orm/core';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/email/email.service';
import { TokenTypeEnum } from '../src/jwt/enums/token-type.enum';
import { JwtService } from '../src/jwt/jwt.service';
import { OAuthProvidersEnum } from '../src/users/enums/oauth-providers.enum';
import { IUser } from '../src/users/interfaces/user.interface';
import { UsersService } from '../src/users/users.service';

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication,
    emailService: EmailService,
    jwtService: JwtService,
    usersService: UsersService,
    orm: MikroORM;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    emailService = app.get(EmailService);
    jest.spyOn(emailService, 'sendEmail').mockImplementation();
    jest.spyOn(emailService, 'sendResetPasswordEmail').mockImplementation();

    jwtService = app.get(JwtService);
    usersService = app.get(UsersService);
    orm = app.get<MikroORM>(MikroORM);
    await orm.getSchemaGenerator().createSchema();

    const configService = app.get(ConfigService);
    await app.register(fastifyCookie, {
      secret: configService.get<string>('COOKIE_SECRET'),
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
      }),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  const name = faker.name.firstName();
  const email = faker.internet.email().toLowerCase();
  const password = faker.internet.password(10) + 'A1!';
  const mockUser = {
    id: 1,
    name,
    email,
    credentials: {
      version: 0,
    },
  } as IUser;
  const newEmail = faker.internet.email().toLowerCase();

  describe('api/auth', () => {
    const baseUrl = '/api/auth';

    describe('sign-up', () => {
      const signUpUrl = `${baseUrl}/sign-up`;

      it('should throw 400 error if email is missing', async () => {
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name,
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if name is missing', async () => {
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            email,
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if password1 is missing', async () => {
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name,
            email,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if password2 is missing', async () => {
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name,
            email,
            password1: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if password1 and password2 do not match', async () => {
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name,
            email,
            password1: password,
            password2: faker.internet.password(10),
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if email is invalid', async () => {
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name,
            email: 'test',
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if password is too short', async () => {
        const newPassword = faker.internet.password(5);
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name,
            email,
            password1: newPassword,
            password2: newPassword,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if name has symbols', async () => {
        await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name: 'test!',
            email,
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should create a new user', async () => {
        const response = await request(app.getHttpServer())
          .post(signUpUrl)
          .send({
            name,
            email,
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.CREATED);
        expect(response.body).toMatchObject({
          id: expect.any(String),
          message: 'Registration successful',
        });
      });
    });

    describe('confirm-email', () => {
      const confirmEmailUrl = `${baseUrl}/confirm-email`;

      it('should throw 400 error if token is missing', async () => {
        await request(app.getHttpServer())
          .post(confirmEmailUrl)
          .send({})
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if token is invalid', async () => {
        await request(app.getHttpServer())
          .post(confirmEmailUrl)
          .send({
            confirmationToken: 'test',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should confirm the user', async () => {
        const confirmationToken = await jwtService.generateToken(
          mockUser,
          TokenTypeEnum.CONFIRMATION,
        );
        const response = await request(app.getHttpServer())
          .post(confirmEmailUrl)
          .send({
            confirmationToken,
          })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          user: expect.any(Object),
          accessToken: expect.any(String),
        });
        mockUser.credentials.version = 1;
      });
    });

    describe('sign-in', () => {
      const signInUrl = `${baseUrl}/sign-in`;

      it('should throw 400 error if email or username is missing', async () => {
        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if password is missing', async () => {
        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            emailOrUsername: email,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if email is invalid', async () => {
        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            emailOrUsername: 'test@test',
            password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 error if username is too long', async () => {
        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            emailOrUsername: faker.internet.userName().repeat(100),
            password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 401 error if user is not confirmed', async () => {
        const newName = faker.name.firstName();
        await usersService.create(
          OAuthProvidersEnum.LOCAL,
          newEmail,
          newName,
          password,
        );

        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            emailOrUsername: newEmail,
            password,
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should throw 401 error if password is incorrect', async () => {
        await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            emailOrUsername: email,
            password: faker.internet.password(10),
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should sign in the user with email', async () => {
        const response = await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            emailOrUsername: email,
            password,
          })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          user: expect.any(Object),
          accessToken: expect.any(String),
        });
      });

      it('should sign in the user with username', async () => {
        const user = await usersService.findOneById(mockUser.id);
        const response = await request(app.getHttpServer())
          .post(signInUrl)
          .send({
            emailOrUsername: user.username,
            password,
          })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          user: expect.any(Object),
          accessToken: expect.any(String),
        });
      });
    });

    describe('logout', () => {
      const logoutUrl = `${baseUrl}/logout`;

      it('should throw 401 if user is not signed in', async () => {
        await request(app.getHttpServer())
          .post(logoutUrl)
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should logout the user', async () => {
        const signInRes = await request(app.getHttpServer())
          .post(`${baseUrl}/sign-in`)
          .send({
            emailOrUsername: email,
            password,
          })
          .expect(HttpStatus.OK);

        await request(app.getHttpServer())
          .post(logoutUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .expect(HttpStatus.OK);
      });
    });

    describe('forgot-password', () => {
      const forgotPasswordUrl = `${baseUrl}/forgot-password`;

      it('should throw 400 if email is missing', async () => {
        await request(app.getHttpServer())
          .post(forgotPasswordUrl)
          .send({})
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 if email is invalid', async () => {
        await request(app.getHttpServer())
          .post(forgotPasswordUrl)
          .send({
            email: 'test@test',
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 200 even if user is not found', async () => {
        const response = await request(app.getHttpServer())
          .post(forgotPasswordUrl)
          .send({
            email: faker.internet.email().toLowerCase(),
          })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          id: expect.any(String),
          message: 'Reset password email sent',
        });
        expect(emailService.sendResetPasswordEmail).not.toHaveBeenCalled();
      });

      it('should send forgot password email', async () => {
        const response = await request(app.getHttpServer())
          .post(forgotPasswordUrl)
          .send({
            email,
          })
          .expect(HttpStatus.OK);
        expect(response.body).toMatchObject({
          id: expect.any(String),
          message: 'Reset password email sent',
        });
        expect(emailService.sendResetPasswordEmail).toHaveBeenCalled();
      });
    });

    const newPassword = faker.internet.password(10) + 'A1!';
    describe('reset-password', () => {
      const resetPasswordUrl = `${baseUrl}/reset-password`;

      it('should throw 400 if token is missing', async () => {
        await request(app.getHttpServer())
          .post(resetPasswordUrl)
          .send({
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 if token is invalid', async () => {
        await request(app.getHttpServer())
          .post(resetPasswordUrl)
          .send({
            resetToken: 'invalid-token',
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reset password', async () => {
        const resetToken = await jwtService.generateToken(
          mockUser,
          TokenTypeEnum.RESET_PASSWORD,
        );
        const response = await request(app.getHttpServer())
          .post(resetPasswordUrl)
          .send({
            resetToken,
            password1: newPassword,
            password2: newPassword,
          })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          id: expect.any(String),
          message: 'Password reset successfully',
        });
      });
    });

    describe('update-password', () => {
      const updatePasswordUrl = `${baseUrl}/update-password`;

      it('should throw 401 if user is not signed in', async () => {
        await request(app.getHttpServer())
          .patch(updatePasswordUrl)
          .send({
            password: newPassword,
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.UNAUTHORIZED);
      });

      it('should throw 400 if password is missing', async () => {
        const signInRes = await request(app.getHttpServer())
          .post(`${baseUrl}/sign-in`)
          .send({
            emailOrUsername: email,
            password: newPassword,
          })
          .expect(HttpStatus.OK);

        await request(app.getHttpServer())
          .patch(updatePasswordUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should throw 400 if password is invalid', async () => {
        const signInRes = await request(app.getHttpServer())
          .post(`${baseUrl}/sign-in`)
          .send({
            emailOrUsername: email,
            password: newPassword,
          })
          .expect(HttpStatus.OK);

        await request(app.getHttpServer())
          .patch(updatePasswordUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({
            password: 'invalid-password',
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should change password', async () => {
        const signInRes = await request(app.getHttpServer())
          .post(`${baseUrl}/sign-in`)
          .send({
            emailOrUsername: email,
            password: newPassword,
          })
          .expect(HttpStatus.OK);

        const response = await request(app.getHttpServer())
          .patch(updatePasswordUrl)
          .set('Authorization', `Bearer ${signInRes.body.accessToken}`)
          .set('Cookie', signInRes.header['set-cookie'])
          .send({
            password: newPassword,
            password1: password,
            password2: password,
          })
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          user: expect.any(Object),
          accessToken: expect.any(String),
        });
      });
    });
  });

  afterAll(async () => {
    await orm.getSchemaGenerator().dropSchema();
    await orm.close(true);
    await app.close();
  });
});
