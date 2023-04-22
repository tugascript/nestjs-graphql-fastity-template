/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

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
