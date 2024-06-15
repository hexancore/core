import { NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { UncaughtErrorCatcher } from '../UncaughtErrorCatcher';
import { setupSwagger } from './SwaggerSetupHelper';
import { toNestLogger } from '@/Util';
import { FAdapterFactoryOptions, FastifyAdapterFactory } from './FastifyAdapterFactory';
import { getLogger, Logger } from '@hexancore/common';

export interface HttpAppFactoryOptions {
  mainModule: any;
  logger?: Logger;
  uncaughtErrorCatcher?: UncaughtErrorCatcher;
  adapter?: FastifyAdapter | FAdapterFactoryOptions;

  swagger?: {
    metadataFn?: () => Promise<Record<string, any>>;
  } | boolean;
}

export class HttpAppFactory {

  public async create(options: HttpAppFactoryOptions): Promise<NestFastifyApplication> {
    const logger = toNestLogger(options.logger ? options.logger : getLogger('app'));
    const errorCatcher = options.uncaughtErrorCatcher ?? new UncaughtErrorCatcher();
    const adapter = await this.createAdapter(options, errorCatcher);

    const appOptions: NestApplicationOptions = {
      logger,
      bufferLogs: false,
    };
    const app = await NestFactory.create<NestFastifyApplication>(options.mainModule, adapter, appOptions);
    app.useGlobalFilters(errorCatcher);

    if (options.swagger) {
      await setupSwagger(app, typeof options.swagger === 'boolean' ? {} : options.swagger);
    }

    return app;
  }

  protected async createAdapter(options: HttpAppFactoryOptions, errorCatcher: UncaughtErrorCatcher): Promise<FastifyAdapter> {
    let adapter: HttpAppFactoryOptions['adapter'] = options.adapter;
    if (!(options.adapter instanceof FastifyAdapter)) {
      const factoryOptions = (options.adapter as FAdapterFactoryOptions) ?? FastifyAdapterFactory.createDefaultOptions(errorCatcher);
      adapter = await FastifyAdapterFactory.create(factoryOptions);
    }
    adapter = adapter as FastifyAdapter;
    return adapter;
  }

}
