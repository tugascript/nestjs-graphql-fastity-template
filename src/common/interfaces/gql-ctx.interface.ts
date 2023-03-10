/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { MercuriusContext } from 'mercurius';
import { IWsCtx } from '../../config/interfaces/ws-ctx.interface';

export interface IGqlCtx extends MercuriusContext {
  ws?: IWsCtx;
}
