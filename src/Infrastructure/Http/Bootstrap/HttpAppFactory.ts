import { NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { UncaughtErrorCatcher } from '../UncaughtErrorCatcher';
import { setupSwagger } from './SwaggerSetupHelper';
import { toNestLogger } from '@/Util';
import { FastifyAdapterFactory, type FAdapterFactoryOptions, type FAdapterStdPluginsOptions, type FPluginRegisterOptions } from './FastifyAdapterFactory';
import { AppMeta, getLogger, Logger } from '@hexancore/common';

export interface HttpAppFactoryOptions {
  logger?: Logger;
  uncaughtErrorCatcher?: UncaughtErrorCatcher;
  adapter?: {
    instance?: FastifyAdapter,
    instanceOptions?: FAdapterFactoryOptions['instanceOptions'],
    stdPlugins?: FAdapterStdPluginsOptions,
    customPlugins?: FPluginRegisterOptions[];
  };
  swagger?: {
    metadataFn?: () => Promise<Record<string, any>>;
  } | boolean;
}

export class HttpAppFactory {

  public async create(mainModule: any, options?: HttpAppFactoryOptions): Promise<NestFastifyApplication> {
    const logger = toNestLogger(options?.logger ? options.logger : getLogger('app'));
    const errorCatcher = options?.uncaughtErrorCatcher ?? new UncaughtErrorCatcher();
    const adapter = await this.createAdapter(errorCatcher, options?.adapter);
    const appOptions: NestApplicationOptions = {
      logger,
      bufferLogs: false,
    };
    const app = await NestFactory.create<NestFastifyApplication>(mainModule, adapter, appOptions);
    app.useGlobalFilters(errorCatcher);

    if (options?.swagger !== false) {
      const enable = !!(options?.swagger || AppMeta.get().isDev());
      if (enable) {
        await setupSwagger(app, options?.swagger === undefined || options?.swagger === true ? {} : options.swagger);
      }

    }

    return app;
  }

  protected async createAdapter(errorCatcher: UncaughtErrorCatcher, options?: HttpAppFactoryOptions['adapter']): Promise<FastifyAdapter> {
    if (options?.instance instanceof FastifyAdapter) {
      const adapter = options.instance as FastifyAdapter;
      errorCatcher.httpAdapter = adapter;
      return adapter;
    }

    const factoryOptions = FastifyAdapterFactory.createDefaultOptions(
      errorCatcher,
      options?.stdPlugins,
      options?.instanceOptions
    );

    if (options?.customPlugins) {
      factoryOptions.plugins.push(...options?.customPlugins);
    }

    const adapter = await FastifyAdapterFactory.create(factoryOptions);
    errorCatcher.httpAdapter = adapter;
    return adapter;
  }

}
