// import { InjectRepository } from '@mikro-orm/nestjs';
// import { EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { ILoaders } from './interfaces/loaders.interface';
// import * as DataLoader from 'dataloader';

@Injectable()
export class DataloadersService {
  //   constructor(
  //     @InjectRepository(SomeEntity)
  //     private readonly userRepository: EntityRepository<SomeEntity>,
  //   ) {}

  public createLoaders(): ILoaders {
    return {};
  }

  //____________________ Logic For Each Loader ____________________
}
