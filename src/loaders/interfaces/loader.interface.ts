import { IBase } from '../../common/interfaces/base.interface';

export interface ILoader<T extends IBase, P = undefined> {
  obj: T;
  params: P;
}
