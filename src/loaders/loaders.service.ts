import { Injectable } from '@nestjs/common';
import { ILoader } from './interfaces/loaders.interface';
import { IBase } from '../common/interfaces/base.interface';

@Injectable()
export class LoadersService {
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
  private static getResults<T>(ids: number[], map: Map<number, T>): T[] {
    const results: T[] = [];

    for (let i = 0; i < ids.length; i++) {
      results.push(map.get(ids[i]));
    }

    return results;
  }
}
