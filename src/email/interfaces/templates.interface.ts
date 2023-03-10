/*
  Free and Open Source - MIT
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
