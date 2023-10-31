import { NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { UncaughtErrorCatcher } from '../UncaughtErrorCatcher';
import { SendResultInterceptor } from '../SendResultInterceptor';
import { setupSwagger } from './SwaggerSetupHelper';
import { toNestLogger } from '@/Util';
import { FAdapterFactoryOptions, FastifyAdapterFactory, STD_PLUGINS } from './FastifyAdapterFactory';
import { getLogger, Logger } from '@hexancore/common';

export interface HttpAppFactoryOptions {
  mainModule: any;
  logger?: Logger;
  uncaughtErrorCatcher?: UncaughtErrorCatcher;
  adapter?: FastifyAdapter | FAdapterFactoryOptions;

  swagger?: boolean;
}

export async function createHttpApp(options: HttpAppFactoryOptions): Promise<NestFastifyApplication> {
  const logger = toNestLogger(options.logger ? options.logger : getLogger('app'));
  const errorCatcher = options.uncaughtErrorCatcher ?? new UncaughtErrorCatcher();

  let adapter = options.adapter;
  if (!(options.adapter instanceof FastifyAdapter)) {
    const factoryOptions = (options.adapter as FAdapterFactoryOptions) ?? FastifyAdapterFactory.createDefaultOptions(errorCatcher);
    adapter = await FastifyAdapterFactory.create(factoryOptions);
  }

  const appOptions: NestApplicationOptions = {
    logger,
  };

  const app = await NestFactory.create<NestFastifyApplication>(options.mainModule, adapter as FastifyAdapter, appOptions);

  app.useGlobalFilters(errorCatcher);
  app.useGlobalInterceptors(new SendResultInterceptor());

  if (options.swagger ?? true) {
    setupSwagger(app);
  }

  return app;
}
