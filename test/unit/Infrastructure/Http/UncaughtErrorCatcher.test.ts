/**
 * @group unit/core
 */

import { M, Mocker } from '@hexancore/mocker';
import { AppError, AppErrorProps } from '@hexancore/common';
import { LoggerService, UnauthorizedException, ArgumentsHost, NotFoundException, HttpStatus } from '@nestjs/common';
import { ContextType, HttpArgumentsHost } from '@nestjs/common/interfaces';
import { FResponse } from '@';
import { UncaughtErrorCatcher } from '@/Infrastructure/Http/UncaughtErrorCatcher';

describe('UncaughtErrorCatcher', () => {
  let logger: M<LoggerService>;
  let catcher: UncaughtErrorCatcher;
  let response: M<FResponse>;
  let argumentsHost: M<ArgumentsHost>;
  let httpArgumentsHost: M<HttpArgumentsHost>;

  beforeEach(() => {
    logger = Mocker.of<LoggerService>();
    catcher = new UncaughtErrorCatcher();

    argumentsHost = Mocker.of<ArgumentsHost>();
    httpArgumentsHost = Mocker.of<HttpArgumentsHost>();
    response = Mocker.of<FResponse>();
  });

  afterEach(() => {
    logger.checkExpections();
    response.checkExpections();
  });

  function expectsHttpArgumentsHost() {
    argumentsHost.expects('getType').andReturn('http');
    argumentsHost.expects('switchToHttp').andReturn(httpArgumentsHost.i);
    httpArgumentsHost.expects('getResponse').andReturn(response.i);
  }

  function expectsResponseSend(status: HttpStatus, expectedAppError: AppErrorProps) {
    response.expects('status', status);
    response.expects('send', expectedAppError);
  }

  test('catch when http and HttpException with AppError response body', () => {
    const error = new UnauthorizedException(new AppError({ type: 'test', code: 401 }));

    expectsHttpArgumentsHost();
    expectsResponseSend(401, {type: "test", code: 401});

    catcher.catch(error, argumentsHost.i as ArgumentsHost);
  });

  test('catch when http and NotFoundException', () => {
    const error = new NotFoundException({ status: 404, message: 'test' });

    expectsHttpArgumentsHost();
    expectsResponseSend(404, { type: 'core.infra.http.not_found_exception', data: { message: 'test' }, code: 404 });

    catcher.catch(error, argumentsHost.i as ArgumentsHost);
  });
});
