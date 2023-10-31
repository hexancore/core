import { AppError, getLogger, INTERNAL_ERROR, isAppError, Logger, LogicError, pascalCaseToSnakeCase } from '@hexancore/common';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { FResponse, sendErrorResponse } from './RestHelperFunctions';

@Catch()
export class UncaughtErrorCatcher implements ExceptionFilter {
  protected logger: Logger;

  public constructor() {
    this.logger = getLogger('uncaught_error_catcher', ['http']);
  }

  public catch(error: unknown, host: ArgumentsHost): void {
    const contextType = host.getType();
    switch (contextType) {
      case 'http':
        this.processErrorInHttp(error, host.switchToHttp());
        break;
      default:
        throw new LogicError('Not implemented yet');
    }
  }

  protected processErrorInHttp(error: unknown, args: HttpArgumentsHost): void {
    const response = args.getResponse();

    if (this.isHttpException(error)) {
      this.processHttpException(error, response);
      return;
    }

    // process as internal error
    this.processInternalError(error as Error, response);
  }

  protected processHttpException(error: HttpException, response: FResponse): void {
    if (error.getStatus() >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.processInternalError(error, response);
      return;
    }

    const responseBody = error.getResponse();
    let appError = isAppError(responseBody) ? responseBody : null;

    if (appError === null) {
      if (responseBody['status']) {
        delete responseBody['status'];
      }
      appError = new AppError({
        type: 'core.infra.http.' + pascalCaseToSnakeCase(error.constructor.name),
        code: error.getStatus(),
        message: error.message,
        data: responseBody,
      });
    }

    sendErrorResponse(appError, response);
  }

  public processInternalError(error: Error, response: FResponse): void {
    const internalError = INTERNAL_ERROR(error);
    this.logger.log(internalError);
    sendErrorResponse(internalError, response);
  }

  protected isHttpException(e: any): e is HttpException {
    return e instanceof HttpException;
  }
}
