/*
 Free and Open Source - GNU GPLv3

 This file is part of nestjs-graphql-fastify-template

 nestjs-graphql-fastify-template is distributed in the
 hope that it will be useful, but WITHOUT ANY WARRANTY;
 without even the implied warranty of MERCHANTABILITY
 or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 General Public License for more details.

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
