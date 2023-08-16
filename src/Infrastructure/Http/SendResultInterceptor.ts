import { Result } from '@hexancore/common';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { map, Observable} from 'rxjs';
import { FResponse, sendResultResponse } from './RestHelperFunctions';

@Injectable()
export class SendResultInterceptor implements NestInterceptor {
  public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response:FResponse = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => {
        if (response.statusCode !== HttpStatus.NO_CONTENT && !(data instanceof Result)) {
          throw new Error('Not Result instance returned from controller: ' + response.request.url);
        }

        sendResultResponse(data, response);
        return null;
      }),
    );
  }
}
