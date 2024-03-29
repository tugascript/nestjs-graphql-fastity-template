/*
 This file is part of Nest GraphQL Fastify Template

 This project is dual-licensed under the Mozilla Public License 2.0 (MPLv2) and the
 GNU General Public License version 3 (GPLv3).

 You may use, distribute, and modify this file under the terms of either the MPLv2
 or GPLv3, at your option. If a copy of these licenses was not distributed with this
 file. You may obtain a copy of the licenses at https://www.mozilla.org/en-US/MPL/2.0/
 and https://www.gnu.org/licenses/gpl-3.0.en.html respectively.

 Copyright © 2023
 Afonso Barracha
*/

import { Collection } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable, Type } from '@nestjs/common';
import { CommonService } from '../common/common.service';
import { FilterRelationDto } from '../common/dtos/filter-relation.dto';
import { IBase } from '../common/interfaces/base.interface';
import { ICreation } from '../common/interfaces/creation.interface';
import { IPaginated } from '../common/interfaces/paginated.interface';
import { ICountResult } from './interfaces/count-result.interface';
import { IExistenceResult } from './interfaces/existence-result.interface';
import { ILoader } from './interfaces/loader.interface';

@Injectable()
export class LoadersService {
  constructor(
    private readonly em: EntityManager,
    private readonly commonService: CommonService,
  ) {}

  /**
   * Get Entities
   *
   * Maps the entity object to the entity itself.
   */
  private static getEntities<T extends IBase, P = undefined>(
    items: ILoader<T, P>[],
  ): T[] {
    const entities: T[] = [];

    for (let i = 0; i < items.length; i++) {
      entities.push(items[i].obj);
    }

    return entities;
  }

  /**
   * Get Entity IDs
   *
   * Maps the entity object to an array of IDs.
   */
  private static getEntityIds<T extends IBase, P = undefined>(
    items: ILoader<T, P>[],
  ): number[] {
    const ids: number[] = [];

    for (let i = 0; i < items.length; i++) {
      ids.push(items[i].obj.id);
    }

    return ids;
  }

  /**
   * Get Relation IDs
   *
   * Maps the entity object many-to-one relation to an array of IDs.
   */
  private static getRelationIds<T extends IBase, P = undefined>(
    items: ILoader<T, P>[],
    relationName: string,
  ): number[] {
    const ids: number[] = [];

    for (let i = 0; i < items.length; i++) {
      ids.push(items[i].obj[relationName].id);
    }

    return ids;
  }

  /**
   * Get Entity Map
   *
   * Turns an array of entity objects to a map of entity objects
   * with its ID as the key.
   */
  private static getEntityMap<T extends IBase>(entities: T[]): Map<number, T> {
    const map = new Map<number, T>();

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      map.set(entity.id, entity);
    }

    return map;
  }

  /**
   * Get Results
   *
   * With the IDs of the relation id array, gets the results of the map.
   */
  private static getResults<T>(
    ids: number[],
    map: Map<number, T>,
    defaultValue: T | null = null,
  ): T[] {
    const results: T[] = [];

    for (let i = 0; i < ids.length; i++) {
      results.push(map.get(ids[i]) ?? defaultValue);
    }

    return results;
  }

  private static getCounterResults(
    ids: number[],
    raw: ICountResult[],
  ): number[] {
    const map = new Map<number, number>();

    for (let i = 0; i < raw.length; i++) {
      const count = raw[i];
      map.set(count.id, count.count);
    }

    return LoadersService.getResults(ids, map, 0);
  }

  /**
   * Basic Counter
   *
   * Loads the count of one-to-many relationships.
   */
  private async basicCounter<T extends IBase, C extends IBase>(
    data: ILoader<T>[],
    parent: Type<T>,
    child: Type<C>,
    childRelation: keyof C,
  ): Promise<number[]> {
    if (data.length === 0) return [];

    const parentId = 'p.id';
    const knex = this.em.getKnex();
    const parentRef = knex.ref(parentId);
    const ids = LoadersService.getEntityIds(data);

    const countQuery = this.em
      .createQueryBuilder(child, 'c')
      .count('c.id')
      .where({ [childRelation]: { $in: parentRef } })
      .as('count');
    const raw: ICountResult[] = await this.em
      .createQueryBuilder(parent, 'p')
      .select([parentId, countQuery])
      .where({ id: { $in: ids } })
      .groupBy(parentId)
      .execute();

    return LoadersService.getCounterResults(ids, raw);
  }

  /**
   * Pivot Counter
   *
   * Loads the count of many-to-many relationships.
   */
  private async pivotCounter<T extends IBase, P extends ICreation>(
    data: ILoader<T>[],
    parent: Type<T>,
    pivot: Type<P>,
    pivotParent: keyof P,
    pivotChild: keyof P,
  ): Promise<number[]> {
    if (data.length === 0) return [];

    const strPivotChild = String(pivotChild);
    const parentId = 'p.id';
    const knex = this.em.getKnex();
    const parentRef = knex.ref(parentId);
    const ids = LoadersService.getEntityIds(data);

    const countQuery = this.em
      .createQueryBuilder(pivot, 'pt')
      .count(`pt.${strPivotChild}_id`, true)
      .where({ [pivotParent]: { $in: parentRef } })
      .as('count');
    const raw: ICountResult[] = await this.em
      .createQueryBuilder(parent, 'p')
      .select([parentId, countQuery])
      .where({ id: { $in: ids } })
      .groupBy(parentId)
      .execute();

    return LoadersService.getCounterResults(ids, raw);
  }

  /**
   * Basic Paginator
   *
   * Loads paginated one-to-many relationships
   */
  private async basicPaginator<T extends IBase, C extends IBase>(
    data: ILoader<T, FilterRelationDto>[],
    parent: Type<T>,
    child: Type<C>,
    parentRelation: keyof T,
    childRelation: keyof C,
    cursor: keyof C,
  ): Promise<IPaginated<C>[]> {
    if (data.length === 0) return [];

    const { first, order } = data[0].params;
    const parentId = 'p.id';
    const childAlias = 'c';
    const childId = 'c.id';
    const knex = this.em.getKnex();
    const parentRef = knex.ref(parentId);
    const parentRel = String(parentRelation);
    const ids = LoadersService.getEntityIds(data);

    const countQuery = this.em
      .createQueryBuilder(child, childAlias)
      .count(childId)
      .where({
        [childRelation]: parentRef,
      })
      .as('count');
    const entitiesQuery = this.em
      .createQueryBuilder(child, childAlias)
      .select(`${childAlias}.id`)
      .where({
        [childRelation]: {
          id: parentRef,
        },
      })
      .orderBy({ [cursor]: order })
      .limit(first)
      .getKnexQuery();
    const results = await this.em
      .createQueryBuilder(parent, 'p')
      .select([parentId, countQuery])
      .leftJoinAndSelect(`p.${parentRel}`, childAlias)
      .groupBy([parentId, childId])
      .where({
        id: { $in: ids },
        [parentRelation]: { $in: entitiesQuery },
      })
      .orderBy({ [parentRelation]: { [cursor]: order } })
      .getResult();
    const map = new Map<number, IPaginated<C>>();

    for (let i = 0; i < results.length; i++) {
      const result = results[i];

      map.set(
        result.id,
        this.commonService.paginate(
          result[parentRelation].getItems(),
          result.count,
          0,
          cursor,
          first,
        ),
      );
    }

    return LoadersService.getResults(
      ids,
      map,
      this.commonService.paginate([], 0, 0, cursor, first),
    );
  }

  /**
   * Pivot Paginator
   *
   * Loads paginated many-to-many relationships
   */
  private async pivotPaginator<
    T extends IBase,
    P extends ICreation,
    C extends IBase,
  >(
    data: ILoader<T, FilterRelationDto>[],
    parent: Type<T>,
    pivot: Type<P>,
    pivotName: keyof T,
    pivotParent: keyof P,
    pivotChild: keyof P,
    cursor: keyof C,
  ): Promise<IPaginated<C>[]> {
    if (data.length === 0) return [];

    // Because of runtime
    const strPivotName = String(pivotName);
    const strPivotChild = String(pivotChild);
    const strPivotParent = String(pivotParent);

    const { first, order } = data[0].params;
    const parentId = 'p.id';
    const knex = this.em.getKnex();
    const parentRef = knex.ref(parentId);
    const ids = LoadersService.getEntityIds(data);

    const countQuery = this.em
      .createQueryBuilder(pivot, 'pt')
      .count(`pt.${strPivotChild}_id`, true)
      .where({ [strPivotParent]: parentRef })
      .as('count');
    const pivotQuery = this.em
      .createQueryBuilder(pivot, 'pt')
      .select('pc.id')
      .leftJoin(`pt.${strPivotChild}`, 'pc')
      .where({ [strPivotParent]: parentRef })
      .orderBy({
        [strPivotChild]: { [cursor]: order },
      })
      .limit(first)
      .getKnexQuery();
    const results = await this.em
      .createQueryBuilder(parent, 'p')
      .select([parentId, countQuery])
      .leftJoinAndSelect(`p.${strPivotName}`, 'e')
      .leftJoinAndSelect(`e.${strPivotChild}`, 'f')
      .where({
        id: { $in: ids },
        [strPivotName]: {
          [strPivotChild]: { $in: pivotQuery },
        },
      })
      .orderBy({
        [strPivotName]: {
          [strPivotChild]: { [cursor]: order },
        },
      })
      .groupBy([`e.${strPivotParent}_id`, 'f.id'])
      .getResult();
    const map = new Map<number, IPaginated<C>>();

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const pivots: Collection<P, T> = result[strPivotName];
      const entities: C[] = [];

      for (const pivot of pivots) {
        entities.push(pivot[strPivotChild]);
      }

      map.set(
        result.id,
        this.commonService.paginate(entities, result.count, 0, cursor, first),
      );
    }

    return LoadersService.getResults(
      ids,
      map,
      this.commonService.paginate([], 0, 0, cursor, first),
    );
  }

  private async getExistence<T extends IBase>(
    data: ILoader<T, FilterRelationDto>[],
    parent: Type<T>,
    fromCondition: string,
  ): Promise<boolean[]> {
    if (data.length === 0) return [];

    const ids = LoadersService.getEntityIds(data);
    const caseString = `
        CASE
          WHEN EXISTS (
            SELECT 1
            ${fromCondition}
          )
          THEN 1
          ELSE 0
        END AS 'existence'
      `;
    const raw: IExistenceResult[] = await this.em
      .createQueryBuilder(parent, 'p')
      .select(['p.id', caseString])
      .where({ id: { $in: ids } })
      .execute();

    const map = new Map<number, boolean>();

    for (let i = 0; i < raw.length; i++) {
      const { id, existence } = raw[i];
      map.set(id, existence === 1);
    }

    return LoadersService.getResults(ids, map);
  }
}
