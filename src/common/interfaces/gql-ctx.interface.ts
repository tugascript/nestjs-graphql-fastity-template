import { MercuriusContext } from 'mercurius';

export interface IGqlCtx extends MercuriusContext {
  user?: number;
  sessionId?: string;
}
