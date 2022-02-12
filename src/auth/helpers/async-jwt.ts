import * as jwt from 'jsonwebtoken';

export const generateToken = async (
  payload: Record<string, any> | string | Buffer,
  secret: string,
  time: number | string,
): Promise<string> =>
  new Promise((resolve, rejects) => {
    jwt.sign(payload, secret, { expiresIn: time }, (error, token) => {
      if (error) {
        rejects(error);
        return;
      }
      resolve(token);
    });
  });

export const verifyToken = async <T>(
  token: string,
  secret: string,
): Promise<T> =>
  new Promise((resolve, rejects) => {
    jwt.verify(token, secret, (error, payload: T) => {
      if (error) {
        rejects(error);
        return;
      }
      resolve(payload);
    });
  });
