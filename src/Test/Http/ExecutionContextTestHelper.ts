import { Mocker } from '@hexancore/mocker';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { of } from 'rxjs';
import { MockResponse } from './MockResponse';

export class ExecutionContextTestHelper {
  public static createHttp(response: MockResponse): ExecutionContext {
    const context = Mocker.of<ExecutionContext>();
    const httpArgumentsHost = Mocker.of<HttpArgumentsHost>();
    httpArgumentsHost.expects('getResponse').andReturn(response);
    context.expects('switchToHttp').andReturn(httpArgumentsHost.i);

    return context.i;
  }

  public static createCallHandler(handleReturn: any): CallHandler {
    return {
      handle: () => of(handleReturn),
    };
  }
}
