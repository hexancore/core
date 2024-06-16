import { HttpStatus, type HttpRedirectResponse } from '@nestjs/common';

export class RedirectResult implements HttpRedirectResponse {
  public constructor(
    public readonly url: string,
    public readonly statusCode: HttpStatus = HttpStatus.FOUND
  ) { }

  public static create(url: string, statusCode: HttpStatus): RedirectResult {
    return new this(url, statusCode);
  }

  public static found(url: string): RedirectResult {
    return new this(url, HttpStatus.FOUND);
  }
}
