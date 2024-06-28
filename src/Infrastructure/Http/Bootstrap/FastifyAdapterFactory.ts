import { FastifyAdapter } from '@nestjs/platform-fastify';
import multipartPlugin, { type FastifyMultipartOptions } from '@fastify/multipart';
import cookiePlugin, { type FastifyCookieOptions } from '@fastify/cookie';
import corsPlugin, { type FastifyCorsOptions } from '@fastify/cors';
import { UncaughtErrorCatcher } from '../UncaughtErrorCatcher';
import { FastifyHttp2Options, FastifyHttp2SecureOptions, FastifyHttpsOptions, FastifyServerOptions } from 'fastify';
import { SecretsService } from '@/Infrastructure/Config';
import { APP_PATHS } from '@/Infrastructure/AppPaths';
import { AppErrorCode, ERR, type DefineErrorsUnion } from '@hexancore/common';
import Validator from 'fastest-validator';

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
const V = new Validator();

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
      const secret = secrets.get('core.http.cookie.sign').onOk((secretRawValue) => {
        const signSecret = secretRawValue.split('\n');
        const check = V.compile({
          $$root: true,
          type: 'array',
          items: { type: 'string', min: 26 },
          unique: true
        });

        const checkResult = check(signSecret);
        if (checkResult !== true) {
          ERR(FastifyErrors.cookie_invalid_secret, AppErrorCode.INTERNAL_ERROR, checkResult).panicIfError();
        }
        return signSecret;
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
  instanceOptions: FastifyHttp2Options<any> | FastifyHttp2SecureOptions<any> | FastifyHttpsOptions<any> | FastifyServerOptions<any>;
  plugins: FPluginRegisterOptions[];
}

export interface FAdapterStdPluginsOptions {
  cookie?: boolean,
  cors?: boolean | FastifyCorsOptions,
  multipart?: boolean | FastifyMultipartOptions,
}

export class FastifyAdapterFactory {
  public static async create(options: FAdapterFactoryOptions): Promise<FastifyAdapter> {
    const adapter = new FastifyAdapter(options.instanceOptions as any);

    const errorHandler = this.createErrorHandler(options.errorCatcher);
    adapter.setErrorHandler(errorHandler);

    const secrets = new SecretsService(APP_PATHS.secretsDir);
    for (const p of options.plugins) {
      if (typeof p.options === 'function') {
        p.options = p.options(secrets);
      }
      await adapter.getInstance().register(p.pluginClass, p.options);
    }

    adapter.getInstance().decorateRequest('session');
    return adapter;
  }

  private static createErrorHandler(errorCatcher: UncaughtErrorCatcher): FastifyAdapterErrorHandler {
    return (error: Error, _request: any, reply: any) => {
      errorCatcher.processInternalError(error, reply);
    };
  }

  public static createDefaultOptions(
    errorCatcher: UncaughtErrorCatcher,
    stdPlugins?: FAdapterStdPluginsOptions,
    instanceOptions?: FAdapterFactoryOptions['instanceOptions']
  ): FAdapterFactoryOptions {

    stdPlugins = stdPlugins ?? ({});
    const plugins: FPluginRegisterOptions[] = [];

    if (stdPlugins.cookie) {
      plugins.push(STD_PLUGINS.cookie);
    }

    if (stdPlugins.cors) {
      plugins.push({
        name: STD_PLUGINS.cors.name,
        pluginClass: STD_PLUGINS.cors.pluginClass,
        options: typeof stdPlugins.cors === 'object' ? stdPlugins.cors : STD_PLUGINS.cors.options
      });
    }

    if (stdPlugins.multipart) {
      plugins.push({
        name: STD_PLUGINS.multipart.name,
        pluginClass: STD_PLUGINS.multipart.pluginClass,
        options: typeof stdPlugins.multipart === 'object' ? stdPlugins.multipart : STD_PLUGINS.multipart.options
      });
    }

    instanceOptions = instanceOptions ?? ({
      pluginTimeout: 20000,
    });

    return { errorCatcher, instanceOptions, plugins };
  }
}
