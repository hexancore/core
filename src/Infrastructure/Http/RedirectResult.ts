import { HttpStatus } from '@nestjs/common';

export class RedirectResult {
  public constructor(public url: string, public statusCode: HttpStatus = HttpStatus.FOUND) {}

  public static found(url: string): RedirectResult {
    return new this(url, HttpStatus.FOUND);
  }
}
