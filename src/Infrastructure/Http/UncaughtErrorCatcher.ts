import { AppError, getLogger, INTERNAL_ERROR, isAppError, Logger, LogicError, pascalCaseToSnakeCase, StdErrors } from '@hexancore/common';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { createErrorResponseBody, FResponse } from './RestHelperFunctions';
import type { AbstractHttpAdapter } from '@nestjs/core';

@Catch()
export class UncaughtErrorCatcher implements ExceptionFilter {
  protected logger: Logger;
  public httpAdapter!: AbstractHttpAdapter;

  public constructor() {
    this.logger = getLogger('core.http.uncaught_error_catcher', ['core', 'http']);
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

  protected processHttpException(error: HttpException, response: FResponse | FResponse['raw']): void {
    if (error.getStatus() >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.processInternalError(error, response);
      return;
    }

    const errorResponse = error.getResponse();
    const appError = isAppError(errorResponse) ? errorResponse : this.createAppErrorFromHttpException(error);

    this.sendResponse(response, appError);
  }

  protected createAppErrorFromHttpException(error: HttpException): AppError {
    const errorResponse = error.getResponse();
    if (errorResponse['status']) {
      delete errorResponse['status'];
    }

    return new AppError({
      type: 'core.infra.http.' + pascalCaseToSnakeCase(error.constructor.name),
      code: error.getStatus(),
      message: error.message,
      data: errorResponse,
    });
  }

  public processInternalError(error: Error, response: FResponse | FResponse['raw']): void {
    let appError: AppError;
    if (this.isHttpException(error)) {
      const cause = isAppError(error.getResponse()) ? error.getResponse() as AppError : null;
      const causeMessage = cause ? cause.getLogMessage() : null;
      const errorMessage = (typeof error.message === 'string' && error.message.length > 0) ? error.message : StdErrors.internal;
      const message = causeMessage ? `${errorMessage}: ${causeMessage}` : errorMessage;

      appError = AppError.create({
        type: StdErrors.internal,
        code: error.getStatus(),
        message,
        error,
        cause,
      });
    } else {
      appError = INTERNAL_ERROR(error);
    }

    this.logger.log(appError);
    this.sendResponse(response, appError);
  }

  protected isHttpException(e: any): e is HttpException {
    return e instanceof HttpException;
  }

  protected sendResponse(response: any, error: AppError): void {
    const body = createErrorResponseBody(error);
    const statusCode = body.code;
    this.httpAdapter.reply(response, body, statusCode);
  }
}
