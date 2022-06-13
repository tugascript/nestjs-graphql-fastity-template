export const PASSWORD_REGEX =
  /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
export const NAME_REGEX = /(^[\p{L}\d'\.\s]*$)/u;
export const SLUG_REGEX = /^[a-z\d]+(?:(\.|-)[a-z\d]+)*$/;
export const BCRYPT_HASH = /\$2[abxy]?\$\d{1,2}\$[A-Za-z\d\./]{53}/;
