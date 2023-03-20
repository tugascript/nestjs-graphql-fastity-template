/*
 Free and Open Source - GNU GPLv3

 This file is part of nestjs-graphql-fastify-template

 nestjs-graphql-fastify-template is distributed in the
 hope that it will be useful, but WITHOUT ANY WARRANTY;
 without even the implied warranty of MERCHANTABILITY
 or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 General Public License for more details.

 Copyright © 2023
 Afonso Barracha
*/

import { Dictionary, FilterQuery } from '@mikro-orm/core';
import { EntityRepository, QueryBuilder } from '@mikro-orm/postgresql';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import slugify from 'slugify';
import { v4 as uuidV4 } from 'uuid';
import { isNull, isUndefined } from '../config/utils/validation.util';
import { ChangeTypeEnum } from './enums/change-type.enum';
import { CursorTypeEnum } from './enums/cursor-type.enum';
import {
  getOppositeOrder,
  getQueryOrder,
  QueryOrderEnum,
  tOppositeOrder,
  tOrderEnum,
} from './enums/query-order.enum';
import { IChange } from './interfaces/change.interface';
import { IEdge, IPaginated } from './interfaces/paginated.interface';

@Injectable()
export class CommonService {
  /**
   * Takes a date, string or number and returns the base 64
   * representation of it
   */
  private static encodeCursor(val: Date | string | number): string {
    let str: string;

    if (val instanceof Date) {
      str = val.getTime().toString();
    } else if (typeof val === 'number' || typeof val === 'bigint') {
      str = val.toString();
    } else {
      str = val;
    }

    return Buffer.from(str, 'utf-8').toString('base64');
  }

  /**
   * Takes an instance, the cursor key and a innerCursor,
   * and generates a GraphQL edge
   */
  private static createEdge<T>(
    instance: T,
    cursor: keyof T,
    innerCursor?: string,
  ): IEdge<T> {
    try {
      return {
        node: instance,
        cursor: CommonService.encodeCursor(
          innerCursor ? instance[cursor][innerCursor] : instance[cursor],
        ),
      };
    } catch (_) {
      throw new InternalServerErrorException('The given cursor is invalid');
    }
  }

  /**
   * Makes the order by query for MikroORM orderBy method.
   */
  private static getOrderBy<T>(
    cursor: keyof T,
    order: QueryOrderEnum,
    innerCursor?: string,
  ): Record<string, QueryOrderEnum | Record<string, QueryOrderEnum>> {
    return innerCursor
      ? {
          [cursor]: {
            [innerCursor]: order,
          },
        }
      : {
          [cursor]: order,
        };
  }

  /**
   * Gets the where clause filter logic for the query builder pagination
   */
  private static getFilters<T>(
    cursor: keyof T,
    decoded: string | number | Date,
    order: tOrderEnum | tOppositeOrder,
    innerCursor?: string,
  ): FilterQuery<Dictionary<T>> {
    return innerCursor
      ? {
          [cursor]: {
            [innerCursor]: {
              [order]: decoded,
            },
          },
        }
      : {
          [cursor]: {
            [order]: decoded,
          },
        };
  }

  /**
   * Takes an entity array and returns the paginated type of that entity array
   * It uses cursor pagination as recommended in https://relay.dev/graphql/connections.htm
   */
  public paginate<T>(
    instances: T[],
    currentCount: number,
    previousCount: number,
    cursor: keyof T,
    first: number,
    innerCursor?: string,
  ): IPaginated<T> {
    const pages: IPaginated<T> = {
      currentCount,
      previousCount,
      edges: [],
      pageInfo: {
        endCursor: '',
        startCursor: '',
        hasPreviousPage: false,
        hasNextPage: false,
      },
    };
    const len = instances.length;

    if (len > 0) {
      for (let i = 0; i < len; i++) {
        pages.edges.push(
          CommonService.createEdge(instances[i], cursor, innerCursor),
        );
      }
      pages.pageInfo.startCursor = pages.edges[0].cursor;
      pages.pageInfo.endCursor = pages.edges[len - 1].cursor;
      pages.pageInfo.hasNextPage = currentCount > first;
      pages.pageInfo.hasPreviousPage = previousCount > 0;
    }

    return pages;
  }

  /**
   * Takes a base64 cursor and returns the string or number value
   */
  public decodeCursor(
    cursor: string,
    cursorType: CursorTypeEnum = CursorTypeEnum.STRING,
  ): string | number | Date {
    const str = Buffer.from(cursor, 'base64').toString('utf-8');

    switch (cursorType) {
      case CursorTypeEnum.DATE:
        const milliUnix = parseInt(str, 10);

        if (isNaN(milliUnix))
          throw new BadRequestException(
            'Cursor does not reference a valid date',
          );

        return new Date(milliUnix);
      case CursorTypeEnum.NUMBER:
        const num = parseInt(str, 10);

        if (isNaN(num))
          throw new BadRequestException(
            'Cursor does not reference a valid number',
          );

        return num;
      case CursorTypeEnum.STRING:
      default:
        return str;
    }
  }

  /**
   * Takes a query builder and returns the entities paginated
   */
  public async queryBuilderPagination<T extends Dictionary>(
    alias: string,
    cursor: keyof T,
    cursorType: CursorTypeEnum,
    first: number,
    order: QueryOrderEnum,
    qb: QueryBuilder<T>,
    after?: string,
    innerCursor?: string,
  ): Promise<IPaginated<T>> {
    const strCursor = String(cursor); // because of runtime issues
    const aliasCursor = `${alias}.${strCursor}`;
    let prevCount = 0;

    if (after) {
      const decoded = this.decodeCursor(after, cursorType);
      const oppositeOd = getOppositeOrder(order);
      const tempQb = qb.clone();
      tempQb.andWhere(
        CommonService.getFilters(cursor, decoded, oppositeOd, innerCursor),
      );
      prevCount = await tempQb.count(aliasCursor, true);

      const normalOd = getQueryOrder(order);
      qb.andWhere(
        CommonService.getFilters(cursor, decoded, normalOd, innerCursor),
      );
    }

    const cqb = qb.clone();
    const [count, entities]: [number, T[]] = await this.throwInternalError(
      Promise.all([
        cqb.count(aliasCursor, true),
        qb
          .select(`${alias}.*`)
          .orderBy(CommonService.getOrderBy(cursor, order, innerCursor))
          .limit(first)
          .getResult(),
      ]),
    );

    return this.paginate(
      entities,
      count,
      prevCount,
      cursor,
      first,
      innerCursor,
    );
  }

  /**
   * Takes an entity repository and a FilterQuery and returns the paginated
   * entities
   */
  public async findAndCountPagination<T extends Dictionary>(
    cursor: keyof T,
    first: number,
    order: QueryOrderEnum,
    repo: EntityRepository<T>,
    where: FilterQuery<T>,
    after?: string,
    afterCursor: CursorTypeEnum = CursorTypeEnum.STRING,
    innerCursor?: string,
  ): Promise<IPaginated<T>> {
    let previousCount = 0;

    if (after) {
      const decoded = this.decodeCursor(after, afterCursor);
      const queryOrder = getQueryOrder(order);
      const oppositeOrder = getOppositeOrder(order);
      const countWhere = where;
      countWhere['$and'] = CommonService.getFilters(
        'createdAt',
        decoded,
        oppositeOrder,
        innerCursor,
      );
      previousCount = await repo.count(countWhere);
      where['$and'] = CommonService.getFilters(
        'createdAt',
        decoded,
        queryOrder,
        innerCursor,
      );
    }

    const [entities, count] = await this.throwInternalError(
      repo.findAndCount(where, {
        orderBy: CommonService.getOrderBy(cursor, order, innerCursor),
        limit: first,
      }),
    );

    return this.paginate(
      entities,
      count,
      previousCount,
      cursor,
      first,
      innerCursor,
    );
  }

  /**
   * Generates an entity change notification. This is useful for realtime apps only.
   */
  public generateChange<T>(
    entity: T,
    nType: ChangeTypeEnum,
    cursor: keyof T,
    innerCursor?: string,
  ): IChange<T> {
    return {
      edge: CommonService.createEdge(entity, cursor, innerCursor),
      type: nType,
    };
  }

  /**
   * Takes a string trims it and capitalizes every word
   */
  public formatTitle(title: string): string {
    return title
      .trim()
      .replace(/\n/g, ' ')
      .replace(/\s\s+/g, ' ')
      .replace(/\w\S*/g, (w) => w.replace(/^\w/, (l) => l.toUpperCase()));
  }

  /**
   * Takes a string trims it and makes it lower case to be used in ILike
   */
  public formatSearch(search: string): string {
    return `%${search
      .trim()
      .replace(/\n/g, ' ')
      .replace(/\s\s+/g, ' ')
      .toLowerCase()}%`;
  }

  /**
   * Takes a string and generates a slug with dots as word separators
   */
  public generatePointSlug(str: string): string {
    return slugify(str, { lower: true, replacement: '.', remove: /['_\.]/g });
  }

  /**
   * Takes a string and generates a slug with a unique identifier at the end
   */
  public generateSlug(str: string): string {
    return slugify(`${str} ${uuidV4().substring(0, 6)}`, {
      lower: true,
      remove: /['_\.]/g,
    });
  }

  public checkEntityExistence<T extends Dictionary>(
    entity: T | null | undefined,
    name: string,
  ): void {
    if (isNull(entity) || isUndefined(entity)) {
      throw new NotFoundException(`${name} not found`);
    }
  }

  /**
   * Validates an entity with the class-validator library
   */
  public async validateEntity(entity: Dictionary): Promise<void> {
    const errors = await validate(entity);

    if (errors.length > 0)
      throw new BadRequestException('Entity validation failed');
  }

  //-------------------- Entity Actions --------------------

  /**
   * Validates, saves and flushes entity into the DB
   */
  public async saveEntity<T extends Dictionary>(
    repo: EntityRepository<T>,
    entity: T,
    isNew = false,
  ): Promise<void> {
    await this.validateEntity(entity);

    if (isNew) repo.persist(entity);

    await this.throwDuplicateError(repo.flush());
  }

  /**
   * Removes an entity from the DB.
   */
  public async removeEntity<T extends Dictionary>(
    repo: EntityRepository<T>,
    entity: T,
  ): Promise<void> {
    await this.throwInternalError(repo.removeAndFlush(entity));
  }

  //-------------------- Error Handling --------------------

  /**
   * Checks is an error is of the code 23505, PostgreSQL's duplicate value error,
   * and throws a conflict exception
   */
  public async throwDuplicateError<T>(promise: Promise<T>, message?: string) {
    try {
      return await promise;
    } catch (error) {
      if (error.code === '23505')
        throw new ConflictException(message ?? 'Duplicated value in database');
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Function to abstract throwing internal server exception
   */
  public async throwInternalError<T>(promise: Promise<T>): Promise<T> {
    try {
      return await promise;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
