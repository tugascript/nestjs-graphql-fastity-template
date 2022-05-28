import { Dictionary, FilterQuery } from '@mikro-orm/core';
import { QueryBuilder } from '@mikro-orm/postgresql';
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
import { NotificationTypeEnum } from './enums/notification-type.enum';
import {
  getQueryOrder,
  getOppositeOrder,
  QueryOrderEnum,
  tOrderEnum,
  tOpositeOrder,
} from './enums/query-order.enum';
import { INotification } from './interfaces/notification.interface';
import { IEdge, IPaginated } from './interfaces/paginated.interface';

@Injectable()
export class CommonService {
  //-------------------- Cursor Pagination --------------------
  private readonly buff = Buffer;

  /**
   * Paginate
   *
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
        pages.edges.push(this.createEdge(instances[i], cursor, innerCursor));
      }
      pages.pageInfo.startCursor = pages.edges[0].cursor;
      pages.pageInfo.endCursor = pages.edges[len - 1].cursor;
      pages.pageInfo.hasNextPage = currentCount > first;
      pages.pageInfo.hasPreviousPage = previousCount > 0;
    }

    return pages;
  }

  /**
   * Create Edge
   *
   * Takes an instance, the cursor key and a innerCursor,
   * and generates a GraphQL edge
   */
  private createEdge<T>(
    instance: T,
    cursor: keyof T,
    innerCursor?: string,
  ): IEdge<T> {
    try {
      return {
        node: instance,
        cursor: this.encodeCursor(
          innerCursor ? instance[cursor][innerCursor] : instance[cursor],
        ),
      };
    } catch (_) {
      throw new InternalServerErrorException('The given cursor is invalid');
    }
  }

  /**
   * Encode Cursor
   *
   * Takes a date, string or number and returns the base 64
   * representation of it
   */
  private encodeCursor(val: Date | string | number): string {
    let str: string;

    if (val instanceof Date) {
      str = val.getTime().toString();
    } else if (typeof val === 'number' || typeof val === 'bigint') {
      str = val.toString();
    } else {
      str = val;
    }

    return this.buff.from(str, 'utf-8').toString('base64');
  }

  /**
   * Decode Cursor
   *
   * Takes a base64 cursor and returns the string or number value
   */
  public decodeCursor(cursor: string, isNum = false): string | number {
    const str = this.buff.from(cursor, 'base64').toString('utf-8');

    if (isNum) {
      const num = parseInt(str, 10);

      if (isNaN(num))
        throw new BadRequestException(
          'Cursor does not reference a valid number',
        );

      return num;
    }

    return str;
  }

  //-------------------- Repository Pagination --------------------

  /**
   * Query Builder Pagination
   *
   * Takes a query builder and returns the entities paginated
   */
  public async queryBuilderPagination<T>(
    alias: string,
    cursor: keyof T,
    first: number,
    order: QueryOrderEnum,
    qb: QueryBuilder<T>,
    after?: string,
    afterIsNum = false,
    innerCursor?: string,
  ): Promise<IPaginated<T>> {
    const strCursor = String(cursor); // because of runtime issues
    let prevCount = 0;

    if (after) {
      const decoded = this.decodeCursor(after, afterIsNum);
      const oppositeOd = getOppositeOrder(order);
      const tempQb = qb.clone();
      tempQb.andWhere(
        this.getFilters(cursor, decoded, oppositeOd, innerCursor),
      );
      prevCount = await tempQb.count(`${alias}.${strCursor}`, true);

      const normalOd = getQueryOrder(order);
      qb.andWhere(this.getFilters(cursor, decoded, normalOd, innerCursor));
    }

    const cqb = qb.clone();
    const [count, entities]: [number, T[]] = await this.throwInternalError(
      Promise.all([
        cqb.count(`${alias}.${strCursor}`, true),
        qb
          .select(`${alias}.*`)
          .orderBy(this.getOrderBy(cursor, order, innerCursor))
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

  private getOrderBy<T>(
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
   * Get Filters
   *
   * Gets the where clause filter logic for the query builder pagination
   */
  private getFilters<T>(
    cursor: keyof T,
    decoded: string | number,
    order: tOrderEnum | tOpositeOrder,
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

  //-------------------- Notification Generation --------------------

  /**
   * Generate Notification
   *
   * Generates an entity notification
   */
  public generateNotification<T>(
    entity: T,
    nType: NotificationTypeEnum,
    cursor: keyof T,
    innerCursor?: string,
  ): INotification<T> {
    return {
      edge: this.createEdge(entity, cursor, innerCursor),
      type: nType,
    };
  }

  //-------------------- String Formating --------------------

  /**
   * Format Title
   *
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
   * Format Search
   *
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
   * Generate Point Slug
   *
   * Takes a string and generates a slug with dots as word separators
   */
  public generatePointSlug(str: string): string {
    return slugify(str, { lower: true, replacement: '.', remove: /['_\.]/g });
  }

  /**
   * Generate Slug
   *
   * Takes a string and generates a slug with a unique identifier at the end
   */
  public generateSlug(str: string): string {
    return slugify(`${str} ${uuidV4().substring(0, 6)}`, {
      lower: true,
      remove: /['_\.]/g,
    });
  }

  //-------------------- Entity Validations --------------------

  /**
   * Check Existence
   *
   * Checks if a findOne query did't return null or undefined
   */
  public checkExistence<T>(name: string, entity?: T | null): void {
    if (!entity) throw new NotFoundException(`${name} not found`);
  }

  /**
   * Validate Entity
   *
   * Validates an entity with the class-validator library
   */
  public async validateEntity(entity: Dictionary<any>): Promise<void> {
    const errors = await validate(entity);

    if (errors.length > 0)
      throw new BadRequestException('Entity validation failed');
  }

  //-------------------- Error Handling --------------------

  /**
   * Throw Duplicate Error
   *
   * Checks is an error is of the code 23505, PostgreSQL's duplicate value error,
   * and throws a conflic exception
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
   * Throw Internal Error
   *
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
