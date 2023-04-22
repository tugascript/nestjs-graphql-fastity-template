/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

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
