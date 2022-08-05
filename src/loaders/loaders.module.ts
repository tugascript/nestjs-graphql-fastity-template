import { Module } from '@nestjs/common';
import { LoadersService } from './loaders.service';

@Module({
  providers: [LoadersService],
  exports: [LoadersService],
})
export class LoadersModule {}
