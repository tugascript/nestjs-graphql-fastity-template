/* eslint-disable @typescript-eslint/no-inferrable-types */
import { Embeddable, Property } from '@mikro-orm/core';
import dayjs from 'dayjs';
import { ICredentials } from '../interfaces/credentials.interface';

@Embeddable()
export class CredentialsEmbeddable {
  @Property({ default: 0 })
  public version: number = 0;

  @Property({ default: '' })
  public lastPassword: string = '';

  @Property({ default: dayjs().unix() })
  public updatedAt: number = dayjs().unix();

  constructor(input?: Partial<ICredentials>) {
    // NOTE: I know this can be done with a forin
    if (input) {
      const { version, lastPassword, updatedAt } = input;
      this.version = version ?? this.version;
      this.lastPassword = lastPassword ?? this.lastPassword;
      this.updatedAt = updatedAt ?? this.updatedAt;
    }
  }

  public updatePassword(password: string): void {
    this.version++;
    this.lastPassword = password;
    this.updatedAt = dayjs().unix();
  }

  public updateVersion(): void {
    this.version++;
    this.updatedAt = dayjs().unix();
  }
}
