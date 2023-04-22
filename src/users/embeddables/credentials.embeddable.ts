/*
 This file is part of Nest GraphQL Fastify Template

 This project is dual-licensed under the Mozilla Public License 2.0 (MPLv2) and the
 GNU General Public License version 3 (GPLv3).

 You may use, distribute, and modify this file under the terms of either the MPLv2
 or GPLv3, at your option. If a copy of these licenses was not distributed with this
 file. You may obtain a copy of the licenses at https://www.mozilla.org/en-US/MPL/2.0/
 and https://www.gnu.org/licenses/gpl-3.0.en.html respectively.

 Copyright © 2023
 Afonso Barracha
*/

import { Embeddable, Property } from '@mikro-orm/core';
import dayjs from 'dayjs';
import { ICredentials } from '../interfaces/credentials.interface';

@Embeddable()
export class CredentialsEmbeddable implements ICredentials {
  @Property({ default: 0 })
  public version: number = 0;

  @Property({ default: '' })
  public lastPassword: string = '';

  @Property({ default: dayjs().unix() })
  public passwordUpdatedAt: number = dayjs().unix();

  @Property({ default: dayjs().unix() })
  public updatedAt: number = dayjs().unix();

  constructor(isConfirmed = false) {
    this.version = isConfirmed ? 1 : 0;
  }

  public updatePassword(password: string): void {
    this.version++;
    this.lastPassword = password;
    const now = dayjs().unix();
    this.passwordUpdatedAt = now;
    this.updatedAt = now;
  }

  public updateVersion(): void {
    this.version++;
    this.updatedAt = dayjs().unix();
  }
}
