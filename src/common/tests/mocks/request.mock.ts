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
