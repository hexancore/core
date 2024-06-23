import { AppError, AppErrorCode, AsyncResult, R, Result, StdErrors, getLogger, type Logger } from '@hexancore/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import * as http2 from 'http2';
import { HttpStatus } from '@nestjs/common';
import { CookieSerializeOptions, UnsignResult } from '@fastify/cookie';
import { default as Reply } from 'fastify/lib/reply';
import { kRouteContext } from 'fastify/lib/symbols';

export interface FRequestCookie {
  cookies: { [cookieName: string]: string | undefined; };

  /**
   * Unsigns the specified cookie using the secret provided.
   * @param value Cookie value
   */
  unsignCookie(value: string): UnsignResult;
}

export declare type FRequest = FastifyRequest & FRequestCookie;

export interface FResponseCookie {
  cookies: { [cookieName: string]: string | undefined; };

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

let RAW_RESPONSE_LOGGER: Logger|undefined = undefined;

export function isNativeResponse(response: any): boolean {
  return !('status' in response);
}

export function toFResponse(response: FResponse | FResponse['raw'], logger?: Logger): FResponse {
  if (!isNativeResponse(response)) {
    return response as FResponse;
  }

  const request = {
    [kRouteContext]: {
      preSerialization: null,
      preValidation: [],
      preHandler: [],
      onSend: [],
      onError: [],
    },
  };

  if (!logger) {
    if (!RAW_RESPONSE_LOGGER) {
      RAW_RESPONSE_LOGGER = getLogger('raw_response_logger', ['http']);
    }
    logger = RAW_RESPONSE_LOGGER;
  }
  return new Reply(response, request, logger);
}

export function createErrorResponseBody(error: AppError): Record<string, any> {
  if (error.error || error.code >= HttpStatus.INTERNAL_SERVER_ERROR) {
    return {
      type: StdErrors.internal,
      message: 'Internal server error',
      code: AppErrorCode.INTERNAL_ERROR,
    };
  }

  // when well defined error
  const body: Record<string, any> = {
    type: error.type,
    code: error.code,
  };

  if (error.data) {
    body.data = error.data;
  }

  if (error.i18n) {
    body.i18n = error.i18n;
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
    return null as any;
  }

  return result;
}
