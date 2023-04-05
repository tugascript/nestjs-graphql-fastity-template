/*
 Free and Open Source - GNU GPLv3

 This file is part of nestjs-graphql-fastify-template

 nestjs-graphql-fastify-template is distributed in the
 hope that it will be useful, but WITHOUT ANY WARRANTY;
 without even the implied warranty of MERCHANTABILITY
 or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 General Public License for more details.

 Copyright © 2023
 Afonso Barracha
*/

import Joi from 'joi';

export const validationSchema = Joi.object({
  APP_ID: Joi.string().uuid({ version: 'uuidv4' }).required(),
  NODE_ENV: Joi.string().required(),
  PORT: Joi.number().required(),
  DOMAIN: Joi.string().domain().required(),
  DATABASE_URL: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_TIME: Joi.number().required(),
  JWT_CONFIRMATION_SECRET: Joi.string().required(),
  JWT_CONFIRMATION_TIME: Joi.number().required(),
  JWT_RESET_PASSWORD_SECRET: Joi.string().required(),
  JWT_RESET_PASSWORD_TIME: Joi.number().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_TIME: Joi.number().required(),
  TWO_FACTOR_TIME: Joi.number().required(),
  REFRESH_COOKIE: Joi.string().required(),
  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().required(),
  EMAIL_SECURE: Joi.bool().required(),
  EMAIL_USER: Joi.string().required(),
  EMAIL_PASSWORD: Joi.string().required(),
  BUCKET_NAME: Joi.string().required(),
  BUCKET_SECRET_KEY: Joi.string().required(),
  BUCKET_ACCESS_KEY: Joi.string().required(),
  BUCKET_REGION: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  REDIS_CACHE_TTL: Joi.number().required(),
  MAX_FILE_SIZE: Joi.number().required(),
  MAX_FILES: Joi.number().required(),
  WS_TIME: Joi.number().required(),
  THROTTLE_TTL: Joi.number().required(),
  THROTTLE_LIMIT: Joi.number().required(),
  MICROSOFT_CLIENT_ID: Joi.string().optional(),
  MICROSOFT_CLIENT_SECRET: Joi.string().optional(),
  MICROSOFT_REDIRECT_URI: Joi.string().optional(),
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_REDIRECT_URI: Joi.string().optional(),
  FACEBOOK_CLIENT_ID: Joi.string().optional(),
  FACEBOOK_CLIENT_SECRET: Joi.string().optional(),
  FACEBOOK_REDIRECT_URI: Joi.string().optional(),
  GITHUB_CLIENT_ID: Joi.string().optional(),
  GITHUB_CLIENT_SECRET: Joi.string().optional(),
  GITHUB_REDIRECT_URI: Joi.string().optional(),
});
