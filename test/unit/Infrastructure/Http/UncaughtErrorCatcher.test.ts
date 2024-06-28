/**
 * @group unit/core
 */

import { UncaughtErrorCatcher } from '@/Infrastructure/Http/UncaughtErrorCatcher';
import { ExecutionContextTestHelper, type MockHttpExecutionContext } from '@/Test/Http';
import { AppError, AppErrorCode, ErrorHelper, StdErrors } from '@hexancore/common';
import { M } from '@hexancore/mocker';
import { HttpStatus, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { type AbstractHttpAdapter } from '@nestjs/core';

describe('UncaughtErrorCatcher', () => {
  let catcher: UncaughtErrorCatcher;
  let adapter: M<AbstractHttpAdapter>;
  let context: MockHttpExecutionContext;

  beforeEach(() => {
    const { adapterHost, adapterMock } = ExecutionContextTestHelper.createHttpAdapterHost();
    adapter = adapterMock;
    catcher = new UncaughtErrorCatcher();
    catcher.httpAdapter = adapterHost.httpAdapter;
    context = ExecutionContextTestHelper.createHttp();
  });

  afterEach(() => {
    adapter.checkExpections();
  });

  function expectsResponseSend(status: HttpStatus, expectedAppError: any) {
    adapter.expects('reply', context.getResponse(), expectedAppError, status);
  }

  test('catch when http and HttpException with AppError response body', () => {
    const error = new UnauthorizedException(new AppError({ type: 'test', code: 401 }));

    expectsResponseSend(401, { type: "test", code: 401 });

    catcher.catch(error, context);
  });

  test('catch when http and NotFoundException', () => {
    const error = new NotFoundException({ status: 404, message: 'test' });

    expectsResponseSend(404, { type: 'core.infra.http.not_found_exception', data: { message: 'test' }, code: 404 });

    catcher.catch(error, context);
  });

  test('catch when http and NotFoundException', () => {
    const appError = new AppError({ type: "core.infra.some_internal_error", code: 400 });
    const error = new InternalServerErrorException(appError);

    expectsResponseSend(500, {
      type: StdErrors.internal,
      code: AppErrorCode.INTERNAL_ERROR,
      message: "Internal server error"
    });

    catcher.catch(error, context);

    const logs = catcher["logger"]["records"];
    const expectedLogs = [{
      level: "error",
      message: 'core.internal_error: core.infra.some_internal_error',
      tags: ["core", "http"],
      context: {
        type: StdErrors.internal,
        code: 500,
        error: ErrorHelper.toPlain(error),
        cause: appError.getLogContext(),
        data: null
      }
    }];
    expect(logs).toEqual(expectedLogs);


  });
});
