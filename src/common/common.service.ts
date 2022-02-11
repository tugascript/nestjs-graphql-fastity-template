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
import { NotificationTypeEnum } from './enums/notification-type.enum';
import { localQueryOrder, QueryOrderEnum } from './enums/query-order.enum';
import { ICountResult } from './interfaces/count-result.interface';
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
   * It uses cursor pagination as recomended in https://graphql.org/learn/pagination/
   */
  public paginate<T>(
    instances: T[],
    totalCount: number,
    cursor: keyof T,
    first: number,
    innerCursor?: string,
  ): IPaginated<T> {
    const pages: IPaginated<T> = {
      totalCount,
      edges: [],
      pageInfo: {
        endCursor: '',
        hasNextPage: false,
      },
    };

    const len = instances.length;
    if (len > 0) {
      for (let i = 0; i < len; i++) {
        pages.edges.push(this.createEdge(instances[i], cursor, innerCursor));
      }
      pages.pageInfo.endCursor = pages.edges[len - 1].cursor;
      pages.pageInfo.hasNextPage = totalCount > first;
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
    name: string,
    cursor: keyof T,
    first: number,
    order: QueryOrderEnum,
    qb: QueryBuilder<T>,
    after?: string,
    afterIsNum = false,
    innerCursor?: string,
  ): Promise<IPaginated<T>> {
    if (after) {
      const decoded = this.decodeCursor(after, afterIsNum);
      const orderOperation = localQueryOrder(order);
      const where: FilterQuery<Record<string, unknown>> = innerCursor
        ? {
            [cursor]: {
              [innerCursor]: {
                [orderOperation]: decoded,
              },
            },
          }
        : {
            [cursor]: {
              [orderOperation]: decoded,
            },
          };

      qb.andWhere(where);
    }

    const nqb = qb;
    const cqb = qb;
    const [countResult, entities]: [ICountResult[], T[]] =
      await this.throwInternalError(
        Promise.all([
          cqb.count(`${name}.${cursor}`, true).execute(),
          nqb
            .select(`${name}.*`)
            .orderBy(this.getOrderBy(cursor, order, innerCursor))
            .limit(first)
            .getResult(),
        ]),
      );

    return this.paginate(
      entities,
      countResult[0].count,
      cursor,
      first,
      innerCursor,
    );
  }

  /**
   * Find And Count Pagination
   *
   * Takes an entity repository and a FilterQuery and returns the paginated
   * entities
   */
  public async findAndCountPagination<T>(
    cursor: keyof T,
    first: number,
    order: QueryOrderEnum,
    repo: EntityRepository<T>,
    where: FilterQuery<T>,
    after?: string,
    afterIsNum = false,
    innerCursor?: string,
  ): Promise<IPaginated<T>> {
    if (after) {
      const decoded = this.decodeCursor(after, afterIsNum);
      const orderOperation = localQueryOrder(order);

      where['$and'] = {
        [cursor]: innerCursor
          ? {
              [innerCursor]: {
                [orderOperation]: decoded,
              },
            }
          : {
              [orderOperation]: decoded,
            },
      };
    }

    const [entities, count] = await repo.findAndCount(where, {
      orderBy: this.getOrderBy(cursor, order, innerCursor),
      limit: first,
    });

    return this.paginate(entities, count, cursor, first, innerCursor);
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
    return slugify(str, { lower: true, replacement: '.' });
  }

  /**
   * Generate Slug
   *
   * Takes a string and generates a slug with a unique identifier at the end
   */
  public generateSlug(str: string): string {
    return slugify(`${str} ${uuidV4().substring(0, 6)}`, { lower: true });
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
