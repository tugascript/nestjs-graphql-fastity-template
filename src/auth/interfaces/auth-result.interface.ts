import { LocalMessageType } from '../../common/gql-types/message.type';

export interface IAuthResult {
  accessToken: string;
  message?: LocalMessageType;
}
