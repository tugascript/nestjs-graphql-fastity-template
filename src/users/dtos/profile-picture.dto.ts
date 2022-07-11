import { ArgsType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { ValidatePromise } from 'class-validator';
import { FileUploadDto } from '../../uploader/dtos/file-upload.dto';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.js';

@ArgsType()
export abstract class ProfilePictureDto {
  @Field(() => GraphQLUpload)
  @ValidatePromise()
  @Type(() => FileUploadDto)
  public picture: Promise<FileUploadDto>;
}
