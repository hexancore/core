
import { Injectable, NestMiddleware } from '@nestjs/common';
import { FRequest, FResponse } from './RestHelperFunctions';

import cookieParser from 'cookie-parser';


@Injectable()
export class CookieParserMiddleware implements NestMiddleware {

  public constructor() {}

  public use(req: FRequest, res: FResponse, next: (error?: Error | any) => void): any {
      cookieParser()(req, res, next);
  }
}