import { RedisOptions } from 'ioredis';

export const redisUrlToOptions = (url: string): RedisOptions => {
  const connectionString = url.split('://')[1];

  if (connectionString.startsWith(':')) {
    const arr = connectionString.split('@');
    const innerArr = arr[1].split(':');

    return {
      password: arr[0].substring(1),
      host: innerArr[0],
      port: parseInt(innerArr[1], 10),
    };
  }

  const arr = connectionString.split(':');
  return {
    host: arr[0],
    port: parseInt(arr[1], 10),
  };
};
