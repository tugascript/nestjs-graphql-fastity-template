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

export const isUndefined = (value: unknown): value is undefined => {
  return typeof value === 'undefined';
};

export const isNull = (value: unknown): value is null => value === null;

export const isArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};
