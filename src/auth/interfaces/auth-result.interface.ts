/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { LocalMessageType } from '../../common/entities/gql/message.type';

export interface IAuthResult {
  accessToken: string;
  message?: LocalMessageType;
}
