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

import { TemplateDelegate } from 'handlebars';
import { ILoginConfirmationData } from './login-confirmation-data.interface';
import { ITemplatedData } from './template-data.interface';

export interface ITemplates {
  readonly confirmation: TemplateDelegate<ITemplatedData>;
  readonly resetPassword: TemplateDelegate<ITemplatedData>;
  readonly loginConfirmation: TemplateDelegate<ILoginConfirmationData>;
}
