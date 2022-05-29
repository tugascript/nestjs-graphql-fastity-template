import { registerEnumType } from '@nestjs/graphql';

export type tOrderEnum = '$gt' | '$lt';
export type tOppositeOrder = '$gte' | '$lte';
export enum QueryOrderEnum {
  ASC = 'ASC',
  DESC = 'DESC',
}

export const getQueryOrder = (order: QueryOrderEnum): tOrderEnum =>
  order === QueryOrderEnum.ASC ? '$gt' : '$lt';

export const getOppositeOrder = (order: QueryOrderEnum): tOppositeOrder =>
  order === QueryOrderEnum.ASC ? '$lte' : '$gte';

registerEnumType(QueryOrderEnum, {
  name: 'QueryOrder',
});
