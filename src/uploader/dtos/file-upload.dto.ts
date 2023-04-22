/*
 This file is part of Nest GraphQL Fastify Template

 This Source Code Form is subject to the terms of the Mozilla Public
 License, v2.0. If a copy of the MPL was not distributed with this
 file, You can obtain one at https://mozilla.org/MPL/2.0/.

 Copyright © 2023
 Afonso Barracha
*/

import { IsMimeType, IsString } from 'class-validator';
import { ReadStream } from 'fs-capacitor';
import { FileUpload } from 'graphql-upload/Upload';

export abstract class FileUploadDto implements FileUpload {
  @IsString()
  public filename!: string;

  @IsString()
  @IsMimeType()
  public mimetype!: string;

  @IsString()
  public encoding!: string;

  public createReadStream!: () => ReadStream;
}
