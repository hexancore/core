import { OK, type R } from '@hexancore/common/lib/mjs';
import { HttpStatus, type HttpRedirectResponse } from '@nestjs/common';

export class RedirectResult implements HttpRedirectResponse {
  public constructor(
    public readonly url: string,
    public readonly statusCode: HttpStatus = HttpStatus.FOUND
  ) { }

  public static create(url: string, statusCode: HttpStatus): R<RedirectResult> {
    return OK(new this(url, statusCode));
  }

  public static found(url: string): R<RedirectResult> {
    return OK(new this(url, HttpStatus.FOUND));
  }
}
