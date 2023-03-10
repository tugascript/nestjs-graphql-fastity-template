/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

export interface IEdge<T> {
  cursor: string;
  node: T;
}

export interface IPageInfo {
  endCursor: string;
  startCursor: string;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IPaginated<T> {
  previousCount: number;
  currentCount: number;
  edges: IEdge<T>[];
  pageInfo: IPageInfo;
}
