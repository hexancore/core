import { NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { UncaughtErrorCatcher } from '../UncaughtErrorCatcher';
import { SendResultInterceptor } from '../SendResultInterceptor';
import { setupSwagger } from './SwaggerSetupHelper';
import { toNestLogger } from '@/Util';
import { createFastifyAdapter, createFastifyAdapterFactoryOptions } from './FastifyAdapterFactory';
import { getLogger, Logger } from '@hexancore/common';

export interface HttpAppFactoryOptions {
  mainModule: any;
  logger?: Logger;
  uncaughtErrorCatcher?: UncaughtErrorCatcher;
  adapter?: FastifyAdapter;
  swagger?: boolean;
}

export async function createHttpApp(options: HttpAppFactoryOptions): Promise<NestFastifyApplication> {
  const logger = toNestLogger(options.logger ? options.logger : getLogger('app'));
  const uncaughtErrorCatcher = options.uncaughtErrorCatcher ?? new UncaughtErrorCatcher();
  const adapter = options.adapter ?? (await createFastifyAdapter(createFastifyAdapterFactoryOptions(uncaughtErrorCatcher)));

  const appOptions: NestApplicationOptions = {
    logger,
  };

  const app = await NestFactory.create<NestFastifyApplication>(options.mainModule, adapter, appOptions);

  app.useGlobalFilters(uncaughtErrorCatcher);
  app.useGlobalInterceptors(new SendResultInterceptor());

  if (options.swagger ?? true) {
    setupSwagger(app);
  }

  return app;
}
