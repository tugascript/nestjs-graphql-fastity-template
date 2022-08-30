import { LocalMessageType } from '../../common/entities/gql/message.type';

export interface IAuthResult {
  accessToken: string;
  message?: LocalMessageType;
}
