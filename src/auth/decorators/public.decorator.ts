/*
  Free and Open Source - MIT
  Copyright © 2023
  Afonso Barracha
*/

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
