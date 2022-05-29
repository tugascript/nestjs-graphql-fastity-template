import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { IBase } from '../interfaces/base.interface';

@Entity({ abstract: true })
export abstract class LocalBaseEntity implements IBase {
  @PrimaryKey()
  public id: number;

  @Property({ onCreate: () => new Date() })
  public createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  public updatedAt: Date = new Date();
}
