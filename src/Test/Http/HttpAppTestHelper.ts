import * as http from 'http';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { InjectPayload } from 'light-my-request';
import { HttpAppFactory, type HttpAppFactoryOptions } from '@/Infrastructure/Http/Bootstrap/HttpAppFactory';
import { TestHttpResponse } from './TestHttpResponse';
import { HttpMethod } from '@/Infrastructure/Http';
import { LogicError } from '@hexancore/common';

export interface InjectRequestOptions {
  payload?: InjectPayload;
  query?: string | { [k: string]: string | string[]; };
  authority?: string;
  cookies?: { [k: string]: string; };
  headers?: http.IncomingHttpHeaders | http.OutgoingHttpHeaders;
}

export class HttpAppTestWrapper {
  public constructor(public wrapped: NestFastifyApplication) { }

  public static async create(mainModule: any, options?: HttpAppFactoryOptions): Promise<HttpAppTestWrapper> {
    const appFactory = new HttpAppFactory();
    const app = await appFactory.create(mainModule, options);
    await app.init();
    return new HttpAppTestWrapper(app);
  }

  public close(): Promise<void> {
    return this.wrapped.close();
  }

  public r(method: HttpMethod, path: string, options?: InjectRequestOptions): TestHttpResponse {
    options = options ?? ({});
    if (options.cookies) {
      const f: any = this.wrapped.getHttpAdapter().getInstance();
      for (const p in options.cookies) {
        if (!f.signCookie) {
          throw new LogicError("No cookie plugin registered in FastifyInstance");
        }
        options.cookies[p] = f.signCookie(options.cookies[p]);
      }

    }
    return new TestHttpResponse(
      {
        method: method,
        url: path,
        ...options,
      },
      this.wrapped
    );
  }

  public post(path: string, payload: InjectPayload, options?: InjectRequestOptions): TestHttpResponse {
    return this.r('POST', path, { payload, ...options });
  }

  public patch(path: string, payload: InjectPayload, options?: InjectRequestOptions): TestHttpResponse {
    return this.r('PATCH', path, { payload, ...options });
  }

  public put(path: string, payload: InjectPayload, options?: InjectRequestOptions): TestHttpResponse {
    return this.r('PUT', path, { payload, ...options });
  }

  public options(path: string, options?: InjectRequestOptions): TestHttpResponse {
    return this.r('OPTIONS', path, options);
  }

  public head(path: string, options?: InjectRequestOptions): TestHttpResponse {
    return this.r('HEAD', path, options);
  }

  public get(path: string, options?: InjectRequestOptions): TestHttpResponse {
    return this.r('GET', path, options);
  }

  public delete(path: string, options?: InjectRequestOptions): TestHttpResponse {
    return this.r('DELETE', path, options);
  }
}
