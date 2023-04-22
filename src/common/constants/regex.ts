/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

export const PASSWORD_REGEX =
  /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
export const NAME_REGEX = /(^[\p{L}\d'\.\s]*$)/u;
export const SLUG_REGEX = /^[a-z\d]+(?:(\.|-)[a-z\d]+)*$/;
export const UNSET_BCRYPT_HASH =
  /UNSET|(\$2[abxy]?\$\d{1,2}\$[A-Za-z\d\./]{53})/;
