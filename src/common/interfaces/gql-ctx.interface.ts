import { MercuriusContext } from 'mercurius';
import { IWsCtx } from '../../config/interfaces/ws-ctx.interface';

export interface IGqlCtx extends MercuriusContext {
  ws?: IWsCtx;
}
