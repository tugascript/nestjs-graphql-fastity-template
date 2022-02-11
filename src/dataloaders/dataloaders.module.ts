import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { DataloadersService } from './dataloaders.service';

@Module({
  imports: [MikroOrmModule.forFeature([])],
  providers: [DataloadersService],
  exports: [DataloadersService],
})
export class DataloadersModule {}
