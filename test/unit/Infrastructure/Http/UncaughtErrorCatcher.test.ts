import { Mocker } from '@hexancore/mocker';
import { AppError } from '@hexancore/common';
import { LoggerService, UnauthorizedException, ArgumentsHost } from '@nestjs/common';
import { ContextType, HttpArgumentsHost } from '@nestjs/common/interfaces';
import { FResponse } from '@';
import { UncaughtErrorCatcher } from '@/Infrastructure/Http/UncaughtErrorCatcher';

describe('UncaughtErrorCatcher', () => {
  let logger: Mocker<LoggerService>;
  let catcher: UncaughtErrorCatcher;

  beforeEach(() => {
    logger = Mocker.of<LoggerService>();
    catcher = new UncaughtErrorCatcher();
  });

  afterEach(() => {
    logger.checkExpections();

  });

  test('catch', () => {
    const error = new UnauthorizedException(new AppError({ type: 'test', code: 401 }));
    const argumentsHost = Mocker.of<ArgumentsHost>();
    const httpArgumentsHost = Mocker.of<HttpArgumentsHost>();
    const response = Mocker.of<FResponse>();
    response.expects('status', 401);
    response.expects('send');
    httpArgumentsHost.expects('getResponse').andReturn(response.i);
    argumentsHost.expects('getType').andReturn('http');
    argumentsHost.expects('switchToHttp').andReturn(httpArgumentsHost.i);

    catcher.catch(error, argumentsHost.i as ArgumentsHost);
  });
});
