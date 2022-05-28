import { registerEnumType } from '@nestjs/graphql';

export type tOrderEnum = '$gt' | '$lt';
export type tOpositeOrder = '$gte' | '$lte';
export enum QueryOrderEnum {
  ASC = 'ASC',
  DESC = 'DESC',
}

export const getQueryOrder = (order: QueryOrderEnum): tOrderEnum =>
  order === QueryOrderEnum.ASC ? '$gt' : '$lt';

export const getOppositeOrder = (order: QueryOrderEnum): tOpositeOrder =>
  order === QueryOrderEnum.ASC ? '$lte' : '$gte';

registerEnumType(QueryOrderEnum, {
  name: 'QueryOrder',
});
