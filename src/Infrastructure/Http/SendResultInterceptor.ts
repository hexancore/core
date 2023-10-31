import { LogicError, Result } from '@hexancore/common';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { FResponse, sendResultResponse } from './RestHelperFunctions';
import { RedirectResult } from './RedirectResult';

@Injectable()
export class SendResultInterceptor implements NestInterceptor {
  private processors: Array<(r: FResponse, data: any) => boolean>;

  public constructor() {
    this.processors = [
      this.checkHasResultWhenNotNoContentStatusProcessor,
      this.redirectResultProcessor,
      this.locationHeaderProcessor,
      this.successResultWithRedirectResultProcessor,
      this.sendResultResponseProcessor,
    ];
  }

  public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const r: FResponse = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => {
        for (const p of this.processors) {
          if (p(r, data)) {
            break;
          }
        }

        if (!r.sent) {
          r.send();
        }

        return null;
      }),
    );
  }

  private redirectResultProcessor(r: FResponse, data: any): boolean {
    if (data instanceof RedirectResult) {
      r.redirect(data.statusCode, data.url);
      return true;
    }
    return false;
  }

  private locationHeaderProcessor(r: FResponse, _data: any): boolean {
    if (r.statusCode === HttpStatus.FOUND && r.getHeader('Location')) {
      return true;
    }
    return false;
  }

  private checkHasResultWhenNotNoContentStatusProcessor(r: FResponse, data: any): boolean {
    if (r.statusCode !== HttpStatus.NO_CONTENT && !(data instanceof Result)) {
      throw new LogicError('Not Result instance returned from controller: ' + r.request.url);
    }

    return false;
  }

  private successResultWithRedirectResultProcessor(r: FResponse, data: any): boolean {
    if (data instanceof Result && data.isSuccess() && data.v instanceof RedirectResult) {
      const redirect = data.v;
      r.redirect(redirect.statusCode, redirect.url);
      return true;
    }
    return false;
  }

  private sendResultResponseProcessor(r: FResponse, data: any): boolean {
    sendResultResponse(data, r);
    return true;
  }
}
