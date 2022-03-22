import { LoadStrategy } from '@mikro-orm/core';
import { IConfig } from './interfaces/config.interface';
import { redisUrlToOptions } from './utils/redis-url-to-options.util';

export function config(): IConfig {
  const testing = process.env.NODE_ENV !== 'production';
  const bucketBase = `${process.env.BUCKET_REGION}.${process.env.BUCKET_HOST}.com`;

  return {
    port: parseInt(process.env.PORT, 10),
    playground: process.env.PLAYGROUND === 'true',
    url: process.env.URL,
    jwt: {
      access: {
        secret: process.env.JWT_ACCESS_SECRET,
        time: parseInt(process.env.JWT_ACCESS_TIME, 10),
      },
      confirmation: {
        secret: process.env.JWT_CONFIRMATION_SECRET,
        time: parseInt(process.env.JWT_CONFIRMATION_TIME, 10),
      },
      resetPassword: {
        secret: process.env.JWT_RESET_PASSWORD_SECRET,
        time: parseInt(process.env.JWT_RESET_PASSWORD_TIME, 10),
      },
      refresh: {
        secret: process.env.JWT_REFRESH_SECRET,
        time: parseInt(process.env.JWT_REFRESH_TIME, 10),
      },
    },
    emailService: {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: Boolean(process.env.EMAIL_SECURE),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    },
    bucketConfig: {
      forcePathStyle: false,
      region: process.env.BUCKET_REGION,
      endpoint: `https://${bucketBase}`,
      credentials: {
        accessKeyId: process.env.BUCKET_ACCESS_KEY,
        secretAccessKey: process.env.BUCKET_SECRET_KEY,
      },
    },
    bucketData: {
      name: process.env.BUCKET_NAME,
      url: `https://${process.env.BUCKET_NAME}.${bucketBase}`,
    },
    db: testing
      ? {
          type: 'sqlite',
          dbName: 'test.db',
          entities: ['dist/**/*.entity.js', 'dist/**/*.embeddable.js'],
          entitiesTs: ['src/**/*.entity.ts', 'src/**/*.embeddable.ts'],
          loadStrategy: LoadStrategy.JOINED,
          allowGlobalContext: true,
        }
      : {
          type: 'postgresql',
          clientUrl: process.env.DATABASE_URL,
          entities: ['dist/**/*.entity.js', 'dist/**/*.embeddable.js'],
          entitiesTs: ['src/**/*.entity.ts', 'src/**/*.embeddable.ts'],
          loadStrategy: LoadStrategy.JOINED,
          allowGlobalContext: true,
        },
    redis: testing ? undefined : redisUrlToOptions(process.env.REDIS_URL),
    ttl: parseInt(process.env.REDIS_CACHE_TTL, 10),
    upload: {
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10),
      maxFiles: parseInt(process.env.MAX_FILES, 10),
    },
    sessionTime: parseInt(process.env.WS_TIME, 10),
    likeOperator: testing ? '$like' : '$ilike',
    throttler: {
      ttl: parseInt(process.env.THROTTLE_TTL, 10),
      limit: parseInt(process.env.THROTTLE_LIMIT, 10),
    },
    testing,
  };
}
