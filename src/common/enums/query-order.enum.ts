import { registerEnumType } from '@nestjs/graphql';

export enum QueryOrderEnum {
  ASC = 'ASC',
  DESC = 'DESC',
  asc = 'asc',
  desc = 'desc',
}

export const localQueryOrder = (val: QueryOrderEnum): '$gt' | '$lt' => {
  switch (val) {
    case QueryOrderEnum.ASC:
    case QueryOrderEnum.asc:
      return '$gt';
    case QueryOrderEnum.DESC:
    case QueryOrderEnum.desc:
    default:
      return '$lt';
  }
};

registerEnumType(QueryOrderEnum, {
  name: 'QueryOrder',
});
