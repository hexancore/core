import { CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { MockResponse } from './MockResponse';
import { MockRequest } from './MockRequest';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';

export class MockHttpExecutionContext extends ExecutionContextHost {
  public constructor(public request: MockRequest, public response: MockResponse, public next?: () => void) {
    super([request, response, next]);
  }

  public getRequest<T = MockRequest>(): T {
    return this.request as any;
  }

  public getResponse<T = MockResponse>(): T {
    return this.response as any;
  }

  public getNext<T = any>(): T {
    return this.next as any;
  }
}

export class ExecutionContextTestHelper {
  public static createHttp(request?: MockRequest | MockResponse, response?: MockResponse, next?: () => void): MockHttpExecutionContext {
    if (request instanceof MockResponse) {
      response = request;
      request = new MockRequest('GET', 'http://127.0.0.1');
    } else {
      request = request ?? new MockRequest('GET', 'http://127.0.0.1');
      response = response ?? new MockResponse(request);
    }

    next = next ?? (() => {});

    return new MockHttpExecutionContext(request, response, next);
  }

  public static createCallHandler(data: any): CallHandler {
    return {
      handle: typeof data === 'function' ? data : () => of(data),
    };
  }
}
