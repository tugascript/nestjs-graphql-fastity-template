import { OnlineStatusEnum } from '../../users/enums/online-status.enum';

export interface ISessionData {
  count: number;
  status: OnlineStatusEnum;
  sessions: Record<string, number>;
}
