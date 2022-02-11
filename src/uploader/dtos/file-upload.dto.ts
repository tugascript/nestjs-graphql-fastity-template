import { IsMimeType, IsString } from 'class-validator';
import { ReadStream } from 'fs-capacitor';

export abstract class FileUploadDto {
  @IsString()
  public filename!: string;

  @IsString()
  @IsMimeType()
  public mimetype!: string;

  @IsString()
  public encoding!: string;

  public createReadStream!: () => ReadStream;
}
