import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { IBucketData } from 'src/config/interfaces/bucket-data.inteface';
import { Readable } from 'stream';
import { v4 as uuidV4 } from 'uuid';
import { CommonService } from '../common/common.service';
import { FileUploadDto } from './dtos/file-upload.dto';
import { MAX_WIDTH, QUALITY_ARRAY } from './utils/uploader.constants';

@Injectable()
export class UploaderService {
  constructor(
    private readonly configService: ConfigService,
    private readonly commonService: CommonService,
  ) {}

  private readonly client = new S3Client(
    this.configService.get<S3ClientConfig>('bucketConfig'),
  );
  private readonly bucketData =
    this.configService.get<IBucketData>('bucketData');

  /**
   * Upload Image
   *
   * Converts an image to jpeg and uploads it to the bucket
   */
  public async uploadImage(
    userId: number,
    file: Promise<FileUploadDto>,
    ratio?: number,
  ): Promise<string> {
    const { mimetype, createReadStream } = await file;

    const imageType = this.validateImage(mimetype);
    if (!imageType)
      throw new BadRequestException('Please upload a valid image');

    let buffer = await this.commonService.throwInternalError(
      this.streamToBuffer(createReadStream()),
    );
    buffer = await this.compressImage(buffer, ratio);

    return await this.uploadFile(userId, buffer, '.jpg');
  }

  /**
   * Delete File
   *
   * Takes an url and deletes the file from the bucket
   */
  public async deleteFile(url: string): Promise<void> {
    if (!this.validateBucketUrl(url))
      throw new BadRequestException('Url not valid');
    const keyArr = url.split('/');

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketData.name,
          Key: keyArr[keyArr.length - 1],
        }),
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private validateImage(mimetype: string): string | false {
    const val = mimetype.split('/');
    if (val[0] !== 'image') return false;

    return val[1] ?? false;
  }

  private validateBucketUrl(url: string): boolean {
    return url.includes(this.bucketData.url.substring(8));
  }

  private async compressImage(buffer: Buffer, ratio?: number): Promise<Buffer> {
    let compressBuffer: sharp.Sharp | Buffer = sharp(buffer).jpeg({
      mozjpeg: true,
      chromaSubsampling: '4:4:4',
    });

    if (ratio)
      compressBuffer.resize({
        width: MAX_WIDTH,
        height: Math.round(MAX_WIDTH * ratio),
        fit: 'cover',
      });

    compressBuffer = await compressBuffer.toBuffer();

    if (compressBuffer.length > 256000) {
      for (let i = 0; i < QUALITY_ARRAY.length; i++) {
        const quality = QUALITY_ARRAY[i];
        const smallerBuffer = await sharp(compressBuffer)
          .jpeg({
            quality,
            chromaSubsampling: '4:4:4',
          })
          .toBuffer();

        if (smallerBuffer.length <= 256000 || quality === 10) {
          compressBuffer = smallerBuffer;
          break;
        }
      }
    }

    return compressBuffer;
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const buffer = [];

    return new Promise((resolve, reject) =>
      stream
        .on('error', (error) => reject(error))
        .on('data', (data) => buffer.push(data))
        .on('end', () => resolve(Buffer.concat(buffer))),
    );
  }

  private async uploadFile(
    userId: number,
    fileBuffer: Buffer,
    fileExt: string,
  ): Promise<string> {
    const key = userId.toString() + '_' + uuidV4() + fileExt;

    await this.commonService.throwInternalError(
      this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketData.name,
          Body: fileBuffer,
          Key: key,
          ACL: 'public-read',
        }),
      ),
    );

    return this.bucketData.url + key;
  }
}
