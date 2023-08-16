import { FastifyAdapter } from '@nestjs/platform-fastify';
import multipartPlugin, { FastifyMultipartBaseOptions } from '@fastify/multipart';
import cookiePlugin, { FastifyCookieOptions } from '@fastify/cookie';
import corsPlugin, { FastifyCorsOptions, FastifyCorsOptionsDelegate } from '@fastify/cors';
import { UncaughtErrorCatcher } from '../UncaughtErrorCatcher';

export type FastifyAdapterFactory = () => Promise<FastifyAdapter>;
export type FastifyAdapterErrorHandler = Parameters<FastifyAdapter['setErrorHandler']>[0];

export interface FastifyAdapterFactoryOptions {
  adapter: {
    pluginTimeout: number;
    errorHandler: FastifyAdapterErrorHandler;
  };
  plugin: {
    multipart: FastifyMultipartBaseOptions;
    cookie: FastifyCookieOptions;
    cors: FastifyCorsOptions | FastifyCorsOptionsDelegate;
  };
}

export function createFastifyAdapterFactoryOptions(
  filter: UncaughtErrorCatcher,
  replaces: Partial<FastifyAdapterFactoryOptions> = {},
): FastifyAdapterFactoryOptions {
  const options = {
    adapter: {
      pluginTimeout: 20000,
      errorHandler: createFastifyErrorHandler(filter),
    },
    plugin: {
      multipart: {
        limits: {
          fieldNameSize: 100,
          fieldSize: 16384,
          fields: 10,
          fileSize: 1000000, // 1MB
          files: 1,
          headerPairs: 2000,
        },
      },
      cookie: {
        secret: 'test',
        parseOptions: {},
      },
      cors: {
        origin: true,
        allowedHeaders: ['Origin', 'X-Requested-With', 'Accept', 'Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 300,
        methods: ['GET', 'PUT', 'OPTIONS', 'POST', 'DELETE'],
      },
    },
  };
  return { ...options, ...replaces };
}

export function createFastifyErrorHandler(filter: UncaughtErrorCatcher): FastifyAdapterErrorHandler {
  return (error: Error, _request: any, reply: any) => {
    filter.processInternalError(error, reply);
  };
}

export async function createFastifyAdapter(options: FastifyAdapterFactoryOptions): Promise<FastifyAdapter> {
  const a = new FastifyAdapter({
    pluginTimeout: options.adapter.pluginTimeout,
  });

  a.setErrorHandler(options.adapter.errorHandler);

  await a.register(multipartPlugin, options.plugin.multipart);
  await a.register(cookiePlugin, options.plugin.cookie);
  await a.register(corsPlugin, options.plugin.cors);

  return a;
}
