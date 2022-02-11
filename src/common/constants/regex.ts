export const PASSWORD_REGEX =
  /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
export const NAME_REGEX = /(^[\p{L}0-9'\.\s]*$)/u;
export const SLUG_REGEX = /^[a-z0-9]+(?:(\.|-)[a-z0-9]+)*$/;
