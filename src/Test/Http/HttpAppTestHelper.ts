import * as http from 'http';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { InjectPayload, Response } from 'light-my-request';
import { createHttpApp } from '@/Infrastructure/Http/Bootstrap/HttpAppFactory';
import { TestHttpResponse } from './TestHttpResponse';
import { HttpMethod } from '@/Infrastructure';

export interface InjectRequestOptions {
  payload?: InjectPayload;
  query?: string | { [k: string]: string | string[] };
  authority?: string;
  cookies?: { [k: string]: string };
  headers?: http.IncomingHttpHeaders | http.OutgoingHttpHeaders;
}

export class HttpAppTestWrapper {
  public constructor(public wrapped: NestFastifyApplication) {}

  public static async create(mainModule: any): Promise<HttpAppTestWrapper> {
    const app = await createHttpApp({
      mainModule,
    });
    await app.init();
    return new HttpAppTestWrapper(app);
  }

  public close(): Promise<void> {
    return this.wrapped.close();
  }

  public r(method: HttpMethod, path: string, options?: InjectRequestOptions): TestHttpResponse {
    return new TestHttpResponse(
      this.wrapped.inject({
        method: method,
        url: path,
        ...options,
      }),
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
