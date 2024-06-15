import { FastifyAdapter } from '@nestjs/platform-fastify';
import multipartPlugin from '@fastify/multipart';
import cookiePlugin, { type FastifyCookieOptions } from '@fastify/cookie';
import corsPlugin from '@fastify/cors';
import { UncaughtErrorCatcher } from '../UncaughtErrorCatcher';
import fastify, { FastifyHttp2Options, FastifyHttp2SecureOptions, FastifyHttpsOptions, FastifyServerOptions } from 'fastify';
import { SecretsService } from '@/Infrastructure/Config';
import { APP_PATHS } from '@/Infrastructure/AppPaths';
import { AppErrorCode, ERR, type DefineErrorsUnion } from '@hexancore/common';

export type FastifyAdapterErrorHandler = Parameters<FastifyAdapter['setErrorHandler']>[0];

export interface FPluginRegisterOptions<PC = any, O = Record<string, any>> {
  name: string;
  pluginClass: PC;
  options: O;
}

export const FastifyErrors = {
  'cookie_invalid_secret': 'core.infra.http.fastify.cookie.invalid_secret'
} as const;

export type FastifyErrors<K extends keyof typeof FastifyErrors> = DefineErrorsUnion<typeof FastifyErrors, K, 'internal'>;

export const STD_PLUGINS: Record<string, FPluginRegisterOptions> = {
  multipart: {
    name: 'multipart',
    pluginClass: multipartPlugin,
    options: {
      limits: {
        fieldNameSize: 100,
        fieldSize: 16384,
        fields: 10,
        fileSize: 2000000, // 2MB
        files: 1,
        headerPairs: 2000,
      },
    },
  },
  cookie: {
    name: 'cookie',
    pluginClass: cookiePlugin,
    options: (secrets: SecretsService): FastifyCookieOptions => {
      const secret = secrets.get('core.http.cookie.sign').onOk((v) => {
        const parsed = v.split("\n").filter((v) => v.length !== 0);
        if (parsed.length === 0) {
          return ERR({ type: FastifyErrors.cookie_invalid_secret, code: AppErrorCode.INTERNAL_ERROR, message: "empty secret list" });
        }
        return parsed;
      });

      secret.panicIfError();

      return {
        secret: secret.v,
        parseOptions: {},
      };
    }
  },
  cors: {
    name: 'cors',
    pluginClass: corsPlugin,
    options: {
      origin: true,
      allowedHeaders: ['Origin', 'X-Requested-With', 'Accept', 'Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 300,
      methods: ['GET', 'PUT', 'HEAD', 'OPTIONS', 'POST', 'DELETE'],
    },
  },
};

export interface FAdapterFactoryOptions {
  errorCatcher: UncaughtErrorCatcher;
  adapter: FastifyHttp2Options<any> | FastifyHttp2SecureOptions<any> | FastifyHttpsOptions<any> | FastifyServerOptions<any>;
  plugins: FPluginRegisterOptions[];
}

export class FastifyAdapterFactory {
  public static async create(options: FAdapterFactoryOptions): Promise<FastifyAdapter> {
    options.adapter.pluginTimeout = options.adapter.pluginTimeout ?? 20000;
    const a = new FastifyAdapter(options.adapter as any);

    const errorHandler = this.createErrorHandler(options.errorCatcher);
    a.setErrorHandler(errorHandler);

    const secrets = new SecretsService(APP_PATHS.secretsDir);

    for (const p of options.plugins) {
      if (typeof p.options === 'function') {
        p.options = p.options(secrets);
      }
      await a.getInstance().register(p.pluginClass, p.options);
    }

    a.getInstance().decorateRequest('session');

    return a as any;
  }

  private static createErrorHandler(errorCatcher: UncaughtErrorCatcher): FastifyAdapterErrorHandler {
    return (error: Error, _request: any, reply: any) => {
      errorCatcher.processInternalError(error, reply);
    };
  }

  public static createDefaultOptions(errorCatcher: UncaughtErrorCatcher): FAdapterFactoryOptions {
    return {
      errorCatcher,
      adapter: {
        pluginTimeout: 20000,
      },
      plugins: [STD_PLUGINS.cookie, STD_PLUGINS.cors, STD_PLUGINS.multipart],
    };
  }
}
