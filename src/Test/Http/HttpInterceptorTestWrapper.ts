import { NestInterceptor } from '@nestjs/common';
import { ExecutionContextTestHelper, MockHttpExecutionContext } from './ExecutionContextTestHelper';
import { MockResponse } from './MockResponse';
import { MockRequest } from './MockRequest';
import { Observable, firstValueFrom } from 'rxjs';

export class HttpInterceptorTestWrapper<T extends NestInterceptor> {
  public context!: MockHttpExecutionContext;

  public constructor(public w: T) {}

  public static wrap<T extends NestInterceptor>(interceptor: T): HttpInterceptorTestWrapper<T> {
    return new this(interceptor);
  }

  public intercept<R>(handlerReturnData: any, requestOrResponse?: MockRequest | MockResponse, response?: MockResponse): R | Promise<R> {
    this.context = ExecutionContextTestHelper.createHttp(requestOrResponse, response);

    const handler = ExecutionContextTestHelper.createCallHandler(handlerReturnData);
    const result = this.w.intercept(this.context, handler);
    if (result['then']) {
      return (result as Promise<Observable<any>>).then((v) => firstValueFrom(v));
    }

    return firstValueFrom(result as Observable<any>);
  }

  public get request(): MockRequest {
    return this.context.getRequest();
  }

  public get response(): MockResponse {
    return this.context.getResponse();
  }
}
