import { AppError, InjectLogger, INTERNAL_ERROR, isAppError, LogicError } from '@hexancore/common';
import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { HttpException, Logger } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { FResponse, sendErrorResponse } from './RestHelperFunctions';

@Catch()
export class UncaughtErrorCatcher implements ExceptionFilter {
  @InjectLogger('uncaught_error_catcher', ["http"])
  protected logger: Logger;

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

  protected processErrorInHttp(error: unknown, args: HttpArgumentsHost) {
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
    if (isAppError(responseBody)) {
      sendErrorResponse(responseBody, response);
      return;
    }

    sendErrorResponse(
      new AppError({
        type: 'core.infra.http.unknown_response_body',
        code: error.getStatus(),
        message: error.message,
        data: responseBody,
      }),
      response,
    );
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
