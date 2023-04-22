/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import { FastifyRequest } from 'fastify';

class RequestMock {
  public cookies: Record<string, string> = {};
  public headers: Record<string, Record<string, string>> = {};

  public setCookie(name: string, value: string): void {
    this.cookies[name] = value;
  }

  public removeCookie(name: string): void {
    delete this.cookies[name];
  }

  public unsignCookie(cookie: string): { value: string; valid: boolean } {
    const value = Object.values(this.cookies).find((c) => c === cookie);
    return { value, valid: true };
  }
}

interface ExtendedRequestMock extends FastifyRequest {
  setCookie: (name: string, value: string) => void;
  removeCookie: (name: string) => void;
}

export const createRequestMock = (): ExtendedRequestMock =>
  new RequestMock() as unknown as ExtendedRequestMock;
