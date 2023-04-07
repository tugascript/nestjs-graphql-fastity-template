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

export interface ISingleJwt {
  readonly secret: string;
  readonly time: number;
}

export interface IJwt {
  readonly access: ISingleJwt;
  readonly confirmation: ISingleJwt;
  readonly resetPassword: ISingleJwt;
  readonly refresh: ISingleJwt;
}
