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

import { FastifyRequest } from 'fastify';

class RequestMock {
  public signedCookies: Record<string, string> = {};
  public headers: Record<string, Record<string, string>> = {};

  public setCookie(name: string, value: string): void {
    this.signedCookies[name] = value;
  }

  public removeCookie(name: string): void {
    delete this.signedCookies[name];
  }
}

interface ExtendedRequestMock extends FastifyRequest {
  setCookie: (name: string, value: string) => void;
  removeCookie: (name: string) => void;
}

export const createRequestMock = (): ExtendedRequestMock =>
  new RequestMock() as unknown as ExtendedRequestMock;
