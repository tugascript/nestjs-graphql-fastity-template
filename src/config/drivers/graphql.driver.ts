import { MercuriusDriver } from '@nestjs/mercurius';
import { FastifyInstance } from 'fastify';
import { printSchema } from 'graphql';
import mercurius from 'mercurius';
import { MercuriusExtendedDriverConfig } from '../interfaces/mercurius-extended-driver-config.interface';
import { addHooks } from '../utils/add-hooks.util';
import { addPlugins } from '../utils/add-plugins.util';

export class GraphQLDriver extends MercuriusDriver {
  constructor() {
    super();
  }

  public async start(
    mercuriusOptions: MercuriusExtendedDriverConfig,
  ): Promise<void> {
    const { plugins, hooks, ...options } =
      await this.graphQlFactory.mergeWithSchema<MercuriusExtendedDriverConfig>(
        mercuriusOptions,
      );

    if (options.definitions && options.definitions.path) {
      await this.graphQlFactory.generateDefinitions(
        printSchema(options.schema),
        options,
      );
    }

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    if (platformName !== 'fastify') {
      throw new Error(`No support for current HttpAdapter: ${platformName}`);
    }
    const app = httpAdapter.getInstance<FastifyInstance>();
    await app.register(mercurius, {
      ...options,
    });
    await addPlugins(app, plugins);
    addHooks(app, hooks);
  }
}
