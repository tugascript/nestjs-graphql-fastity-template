export interface IEdge<T> {
  cursor: string;
  node: T;
}

interface IPageInfo {
  endCursor: string;
  hasNextPage: boolean;
}

export interface IPaginated<T> {
  totalCount: number;
  edges: IEdge<T>[];
  pageInfo: IPageInfo;
}
