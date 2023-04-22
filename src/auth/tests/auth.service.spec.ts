/*
 This file is part of Nest GraphQL Fastify Template

 This project is dual-licensed under the Mozilla Public License 2.0 (MPLv2) and the
 GNU General Public License version 3 (GPLv3).

 You may use, distribute, and modify this file under the terms of either the MPLv2
 or GPLv3, at your option. If a copy of these licenses was not distributed with this
 file. You may obtain a copy of the licenses at https://www.mozilla.org/en-US/MPL/2.0/
 and https://www.gnu.org/licenses/gpl-3.0.en.html respectively.

 Copyright © 2023
 Afonso Barracha
*/

import { faker } from '@faker-js/faker';
import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { Cache } from 'cache-manager';
import { isJWT, isUUID } from 'class-validator';
import { CommonModule } from '../../common/common.module';
import { CommonService } from '../../common/common.service';
import { config } from '../../config';
import { MikroOrmConfig } from '../../config/mikroorm.config';
import { ThrottlerConfig } from '../../config/throttler.config';
import { validationSchema } from '../../config/validation.config';
import { EmailModule } from '../../email/email.module';
import { EmailService } from '../../email/email.service';
import { TokenTypeEnum } from '../../jwt/enums/token-type.enum';
import { IRefreshToken } from '../../jwt/interfaces/refresh-token.interface';
import { JwtModule } from '../../jwt/jwt.module';
import { JwtService } from '../../jwt/jwt.service';
import { UserEntity } from '../../users/entities/user.entity';
import { IUser } from '../../users/interfaces/user.interface';
import { UsersModule } from '../../users/users.module';
import { UsersService } from '../../users/users.service';
import { AuthService } from '../auth.service';

describe('AuthService', () => {
  let module: TestingModule,
    authService: AuthService,
    emailService: EmailService,
    usersService: UsersService,
    jwtService: JwtService,
    commonService: CommonService,
    cacheManager: Cache,
    orm: MikroORM;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validationSchema,
          load: [config],
        }),
        CacheModule.register({
          isGlobal: true,
          ttl: parseInt(process.env.JWT_REFRESH_TIME, 10),
        }),
        MikroOrmModule.forRootAsync({
          imports: [ConfigModule],
          useClass: MikroOrmConfig,
        }),
        CommonModule,
        UsersModule,
        JwtModule,
        EmailModule,
        ThrottlerModule.forRootAsync({
          imports: [ConfigModule],
          useClass: ThrottlerConfig,
        }),
      ],
      providers: [AuthService, CommonModule],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    emailService = module.get<EmailService>(EmailService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    commonService = module.get<CommonService>(CommonService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    orm = module.get<MikroORM>(MikroORM);
    await orm.getSchemaGenerator().createSchema();

    jest.spyOn(emailService, 'sendEmail').mockImplementation();
  });

  const name = faker.name.firstName();
  const email = faker.internet.email().toLowerCase();
  const password = faker.internet.password(10);
  const baseUser = {
    id: 1,
    email,
    credentials: {
      version: 0,
    },
  } as IUser;

  it('should be defined', () => {
    expect(module).toBeDefined();
    expect(authService).toBeDefined();
    expect(emailService).toBeDefined();
    expect(usersService).toBeDefined();
    expect(jwtService).toBeDefined();
    expect(commonService).toBeDefined();
    expect(cacheManager).toBeDefined();
    expect(orm).toBeDefined();
  });

  describe('sign up', () => {
    it('should create a new user', async () => {
      jest.spyOn(emailService, 'sendConfirmationEmail').mockImplementation();

      const message = await authService.signUp({
        name,
        email,
        password1: password,
        password2: password,
      });
      expect(message.message).toStrictEqual('Registration successful');
      expect(isUUID(message.id)).toBe(true);
      expect(emailService.sendConfirmationEmail).toHaveBeenCalled();
    });

    it('should throw an error if the passwords do not match', async () => {
      const password = faker.internet.password(10);
      await expect(
        authService.signUp({
          name: faker.name.firstName(),
          email: faker.internet.email(),
          password1: password,
          password2: password + '1',
        }),
      ).rejects.toThrowError('Passwords do not match');
    });
  });

  describe('confirm email', () => {
    let token: string;

    it('should create a confirmation token', async () => {
      token = await jwtService.generateToken(
        baseUser,
        TokenTypeEnum.CONFIRMATION,
      );
      expect(token).toBeDefined();
      expect(isJWT(token)).toBe(true);
    });

    it('should confirm the email', async () => {
      const result = await authService.confirmEmail({
        confirmationToken: token,
      });
      expect(result.user).toBeInstanceOf(UserEntity);
      expect(result.user.confirmed).toBe(true);
      expect(result.accessToken).toBeDefined();
      expect(isJWT(result.accessToken)).toBe(true);
      expect(result.refreshToken).toBeDefined();
      expect(isJWT(result.refreshToken)).toBe(true);
    });

    it('should throw an error if the token is invalid', async () => {
      await expect(
        authService.confirmEmail({
          confirmationToken: token + '1',
        }),
      ).rejects.toThrowError('Invalid token');
    });

    it('should throw an unauthorized error if token already used', async () => {
      await expect(
        authService.confirmEmail({
          confirmationToken: token,
        }),
      ).rejects.toThrowError('Invalid credentials');
    });

    it('should throw a bad request error if user is already confirmed', async () => {
      const newToken = await jwtService.generateToken(
        {
          ...baseUser,
          credentials: {
            ...baseUser.credentials,
            version: 1,
          },
        },
        TokenTypeEnum.CONFIRMATION,
      );
      await expect(
        authService.confirmEmail({
          confirmationToken: newToken,
        }),
      ).rejects.toThrowError('Email already confirmed');
    });
  });

  describe('sign in', () => {
    it('should sign in an user by email', async () => {
      const { title, value } = await authService.signIn({
        emailOrUsername: email,
        password,
      });
      expect(title).toStrictEqual('auth');

      if (title === 'auth') {
        expect(value.user).toBeInstanceOf(UserEntity);
        expect(value.accessToken).toBeDefined();
        expect(isJWT(value.accessToken)).toBe(true);
        expect(value.refreshToken).toBeDefined();
        expect(isJWT(value.refreshToken)).toBe(true);
      }
    });

    it('should sign in an user by username', async () => {
      const { title, value } = await authService.signIn({
        emailOrUsername: commonService.generatePointSlug(name),
        password,
      });
      expect(title).toStrictEqual('auth');

      if (title === 'auth') {
        expect(value.user).toBeInstanceOf(UserEntity);
        expect(value.accessToken).toBeDefined();
        expect(isJWT(value.accessToken)).toBe(true);
        expect(value.refreshToken).toBeDefined();
        expect(isJWT(value.refreshToken)).toBe(true);
      }
    });

    it('should throw an unauthorized exception if the password is wrong', async () => {
      await expect(
        authService.signIn({
          emailOrUsername: email,
          password: password + '1',
        }),
      ).rejects.toThrowError('Invalid credentials');
    });

    it('should throw an unauthorized exception if email or username is wrong', async () => {
      await expect(
        authService.signIn({
          emailOrUsername: faker.internet.email(),
          password,
        }),
      ).rejects.toThrowError('Invalid credentials');
    });

    it('should throw a bad request exception if the email is malformed', async () => {
      await expect(
        authService.signIn({
          emailOrUsername: faker.internet.email() + '&',
          password,
        }),
      ).rejects.toThrowError('Invalid email');
    });

    it('should throw a bad request exception if the username is malformed', async () => {
      await expect(
        authService.signIn({
          emailOrUsername: 'username&',
          password,
        }),
      ).rejects.toThrowError('Invalid username');
    });

    it('should throw an error if the user is not confirmed', async () => {
      const email2 = faker.internet.email().toLowerCase();
      await authService.signUp({
        name,
        email: email2,
        password1: password,
        password2: password,
      });
      await expect(
        authService.signIn({
          emailOrUsername: email2,
          password,
        }),
      ).rejects.toThrowError(
        'Please confirm your email, a new email has been sent',
      );
    });
  });

  describe('refresh token', () => {
    let token: string;

    it('should create a refresh token', async () => {
      token = await jwtService.generateToken(
        {
          ...baseUser,
          credentials: {
            ...baseUser.credentials,
            version: 1,
          },
        },
        TokenTypeEnum.REFRESH,
      );
      expect(token).toBeDefined();
      expect(isJWT(token)).toBe(true);
    });

    it('should refresh the token', async () => {
      const result = await authService.refreshTokenAccess(token);
      expect(result.accessToken).toBeDefined();
      expect(isJWT(result.accessToken)).toBe(true);
      expect(result.refreshToken).toBeDefined();
      expect(isJWT(result.refreshToken)).toBe(true);
    });

    it('should throw an error if the token is invalid', async () => {
      await expect(
        authService.refreshTokenAccess(token + '1'),
      ).rejects.toThrowError('Invalid token');
    });
  });

  describe('logout', () => {
    it('should blacklist the token', async () => {
      const token = await jwtService.generateToken(
        baseUser,
        TokenTypeEnum.REFRESH,
      );
      const { id, tokenId } = await jwtService.verifyToken<IRefreshToken>(
        token,
        TokenTypeEnum.REFRESH,
      );
      expect(
        await cacheManager.get(`blacklist:${id}:${tokenId}`),
      ).toBeUndefined();
      const message = await authService.logout(token);
      expect(message.message).toStrictEqual('Logout successful');
      expect(isUUID(message.id)).toBe(true);
      expect(
        await cacheManager.get(`blacklist:${id}:${tokenId}`),
      ).toBeDefined();

      await expect(authService.refreshTokenAccess(token)).rejects.toThrowError(
        'Invalid token',
      );
    });
  });

  describe('reset password email', () => {
    it('should send the reset password email', async () => {
      jest.spyOn(emailService, 'sendResetPasswordEmail').mockImplementation();

      const message = await authService.resetPasswordEmail({ email });
      expect(message.message).toStrictEqual('Reset password email sent');
      expect(isUUID(message.id)).toBe(true);
      expect(emailService.sendResetPasswordEmail).toBeCalledTimes(1);
    });

    it('should not sent the reset password email', async () => {
      const message = await authService.resetPasswordEmail({
        email: faker.internet.email(),
      });
      expect(message.message).toStrictEqual('Reset password email sent');
      expect(isUUID(message.id)).toBe(true);
      expect(emailService.sendResetPasswordEmail).toBeCalledTimes(1);
    });
  });

  const newPassword = faker.internet.password();
  describe('reset password', () => {
    let token: string;

    it('should create a reset password token', async () => {
      token = await jwtService.generateToken(
        {
          ...baseUser,
          credentials: {
            ...baseUser.credentials,
            version: 1,
          },
        },
        TokenTypeEnum.RESET_PASSWORD,
      );
      expect(token).toBeDefined();
      expect(isJWT(token)).toBe(true);
    });

    it('should throw an error if the passwords do not match', async () => {
      await expect(
        authService.resetPassword({
          resetToken: token,
          password1: newPassword,
          password2: newPassword + '1',
        }),
      ).rejects.toThrowError('Passwords do not match');
    });

    it('should reset the password', async () => {
      const message = await authService.resetPassword({
        resetToken: token,
        password1: newPassword,
        password2: newPassword,
      });
      expect(message.message).toStrictEqual('Password reset successfully');
      expect(isUUID(message.id)).toBe(true);
    });

    it('should throw an error if the token is invalid', async () => {
      await expect(
        authService.resetPassword({
          resetToken: token + '1',
          password1: newPassword,
          password2: newPassword,
        }),
      ).rejects.toThrowError('Invalid token');
    });

    it('should throw an unauthorized exception if token has been used', async () => {
      await expect(
        authService.resetPassword({
          resetToken: token,
          password1: newPassword,
          password2: newPassword,
        }),
      ).rejects.toThrowError('Invalid credentials');
    });

    it('old password should not work', async () => {
      await expect(
        authService.signIn({
          emailOrUsername: email,
          password,
        }),
      ).rejects.toThrowError('You changed your password recently');
    });
  });

  const newPassword2 = faker.internet.password();
  describe('change password', () => {
    it('should throw an error if the passwords do not match', async () => {
      await expect(
        authService.updatePassword(1, {
          password1: newPassword2,
          password2: newPassword2 + '1',
          password: newPassword,
        }),
      ).rejects.toThrowError('Passwords do not match');
    });

    it('should throw an error if the old password is incorrect', async () => {
      await expect(
        authService.updatePassword(1, {
          password1: newPassword2,
          password2: newPassword2,
          password: newPassword + '1',
        }),
      ).rejects.toThrowError('Wrong password');
    });

    it('should throw an error if password is the same as the old password', async () => {
      await expect(
        authService.updatePassword(1, {
          password1: newPassword,
          password2: newPassword,
          password: newPassword,
        }),
      ).rejects.toThrowError('New password must be different');
    });

    it('should change the password', async () => {
      const result = await authService.updatePassword(1, {
        password1: newPassword2,
        password2: newPassword2,
        password: newPassword,
      });
      expect(result.user).toBeInstanceOf(UserEntity);
      expect(result.accessToken).toBeDefined();
      expect(isJWT(result.accessToken)).toBe(true);
      expect(result.refreshToken).toBeDefined();
      expect(isJWT(result.refreshToken)).toBe(true);
    });

    it('old password should not work', async () => {
      await expect(
        authService.signIn({
          emailOrUsername: email,
          password: newPassword,
        }),
      ).rejects.toThrowError('You changed your password recently');
    });
  });

  afterAll(async () => {
    await orm.getSchemaGenerator().dropSchema();
    await orm.close(true);
    await module.close();
  });
});
