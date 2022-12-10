import { GqlModuleOptions } from '@nestjs/graphql';
import { MercuriusOptions } from 'mercurius';
import { MercuriusHooks } from './mercurius-hook.interface';
import { MercuriusPlugins } from './mercurius-plugin.interface';

export type MercuriusExtendedDriverConfig = GqlModuleOptions &
  MercuriusOptions &
  MercuriusPlugins &
  MercuriusHooks;
