/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

export interface IUnion<K extends string, T> {
  readonly title: K;
  readonly value: T;
}
