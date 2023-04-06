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

import { FastifyReply } from 'fastify';

class ResponseMock {
  public cookie = jest.fn().mockReturnThis();
  public clearCookie = jest.fn().mockReturnThis();
  public status = jest.fn().mockReturnThis();
  public header = jest.fn().mockReturnThis();
  public send = jest.fn().mockReturnThis();
}

export const createResponseMock = (): FastifyReply =>
  new ResponseMock() as unknown as FastifyReply;
