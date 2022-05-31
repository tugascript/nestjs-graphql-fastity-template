import { Module } from '@nestjs/common';
import { LoadersService } from './loaders.service';

@Module({
  // imports: [MikroOrmModule.forFeature([UserEntity, etc...])], all the entities you need for the loader
  providers: [LoadersService],
  exports: [LoadersService],
})
export class LoadersModule {}
