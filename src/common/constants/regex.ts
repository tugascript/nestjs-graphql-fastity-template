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

export const PASSWORD_REGEX =
  /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
export const NAME_REGEX = /(^[\p{L}\d'\.\s]*$)/u;
export const SLUG_REGEX = /^[a-z\d]+(?:(\.|-)[a-z\d]+)*$/;
export const BCRYPT_HASH = /\$2[abxy]?\$\d{1,2}\$[A-Za-z\d\./]{53}/;
