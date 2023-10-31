import { AppError, AppErrorCode, AsyncResult, ErrorHelper, INTERNAL_ERROR_TYPE, R, Result } from '@hexancore/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import * as http2 from 'http2';
import { HttpStatus } from '@nestjs/common';
import { CookieSerializeOptions, UnsignResult } from '@fastify/cookie';

export interface FRequestCookie {
  cookies: { [cookieName: string]: string | undefined };

  /**
   * Unsigns the specified cookie using the secret provided.
   * @param value Cookie value
   */
  unsignCookie(value: string): UnsignResult;
}

export declare type FRequest = FastifyRequest & FRequestCookie;

export interface FResponseCookie {
  cookies: { [cookieName: string]: string | undefined };

  /**
   * Set response cookie
   * @name setCookie
   * @param name Cookie name
   * @param value Cookie value
   * @param options Serialize options
   */
  setCookie(name: string, value: string, options?: CookieSerializeOptions): this;

  /**
   * @alias setCookie
   */
  cookie(name: string, value: string, options?: CookieSerializeOptions): this;

  /**
   * clear response cookie
   * @param name Cookie name
   * @param options Serialize options
   */
  clearCookie(name: string, options?: CookieSerializeOptions): this;
}

export declare type FResponse = FastifyReply<http2.Http2Server> & FResponseCookie;

export declare type HttpMethod = 'DELETE' | 'GET' | 'HEAD' | 'PATCH' | 'POST' | 'PUT' | 'OPTIONS';

export function createErrorResponseBody(error: AppError): Record<string, any> {
  let body: Record<string, any>;
  if (error.error) {
    if (process.env.APP_DEBUG || process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'test') {
      // when debug mode add more info to response
      body = {
        type: error.type,
        message: error.message,
        error: ErrorHelper.toPlain(error.error),
        code: AppErrorCode.INTERNAL_ERROR,
        data: error.data,
      };
    } else {
      // when is some unknown internal error and not debug mode output minimum info
      body = {
        type: INTERNAL_ERROR_TYPE,
        message: 'Internal server error',
        code: AppErrorCode.INTERNAL_ERROR,
      };
    }
  } else {
    // when well defined error
    body = {
      type: error.type,
      code: error.code,
    };

    if (error.data) {
      body.data = error.data;
    }

    if (error.i18n) {
      body.i18n = error.i18n;
    }
  }

  return body;
}

export function sendErrorResponse(error: AppError, response: FResponse): void {
  const body = createErrorResponseBody(error);
  response.status(body.code);
  response.send(body);
}

export function sendResultResponse(result: Result<any>, response: FResponse, successCode: HttpStatus = HttpStatus.OK): void {
  if (result.isError()) {
    sendErrorResponse(result.e, response);
    return;
  }

  if (result.v === null) {
    successCode = HttpStatus.NO_CONTENT;
  }

  response.status(successCode);

  if (successCode === HttpStatus.CREATED || successCode === HttpStatus.NO_CONTENT) {
    response.send();
    return;
  }
  response.send(result.v);
}

export async function sendAsyncResultResponse(result: AsyncResult<any>, response: FResponse, successCode = HttpStatus.OK): Promise<void> {
  sendResultResponse(await result, response, successCode);
}

export function checkResultAndSendOnError<T>(result: Result<T>, response: FResponse): R<T> {
  if (result.isError()) {
    sendErrorResponse(result.e, response);
    return null;
  }

  return result;
}
