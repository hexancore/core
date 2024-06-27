import { AsyncResult, Logger, LogicError, R, Result, SAR, getLogger, pascalCaseToSnakeCase } from '@hexancore/common';
import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map, of } from 'rxjs';
import { GroupableInterceptor } from './GroupableInterceptor';
import { createErrorResponseBody, type FResponse } from '..';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';

@Injectable()
export class HttpOrderedInterceptorGroup implements NestInterceptor {
  protected interceptors: { priority: number; interceptor: GroupableInterceptor<HttpArgumentsHost>; }[] = [];
  protected argumentsHostExtractor: (context: ExecutionContext) => HttpArgumentsHost;
  protected logger: Logger;

  public constructor(protected name: string, protected returnUnwarpedResult: boolean) {
    this.argumentsHostExtractor = ((context: ExecutionContext) => context.switchToHttp()) as any;
    this.name = pascalCaseToSnakeCase(this.name);
    this.logger = getLogger(`core.infra.http.ordered_interceptor_group.${this.name}`, ['infra', 'http']);
  }

  public add(priority: number, interceptor: GroupableInterceptor<HttpArgumentsHost>): void {
    this.interceptors.push({ priority, interceptor });
    this.interceptors.sort((a, b) => a.priority - b.priority).reverse();
    this.logger.info(`Added interceptor(priority: ${priority}): ${interceptor.getName()}`, {}, ['di']);
  }

  public async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const args = this.argumentsHostExtractor(context);

    for (const i of this.interceptors) {
      let r = i.interceptor.beforeRoute(args);
      if (r instanceof AsyncResult) {
        r = await r;
      }

      if (r.isError()) {
        return of(this.onErrorResult(r));
      }
    }
    return next.handle().pipe(
      map(async (data) => {
        if (!this.isResultOrAsyncResult(data)) {
          throw this.noResultFromRouteError(args);
        }

        for (const i of this.interceptors) {
          data = i.interceptor.afterRoute(args, data);
          if (!this.isResultOrAsyncResult(data)) {
            throw this.noResultFromInterceptorError(args, i.interceptor.getName());
          }
        }

        if (this.returnUnwarpedResult) {
          if (!args.getResponse<FResponse>().hasHeader('content-type')) {
            args.getResponse<FResponse>().type('application/json');
          }

          data = await this.unwarpResult(data);
        }

        return data;
      }),
    );
  }

  protected isResultOrAsyncResult(data: any): boolean {
    return data instanceof Result || data instanceof AsyncResult;
  }

  protected noResultFromRouteError(args: HttpArgumentsHost): Error {
    return new LogicError(`No Result/AsyncResult return from route: ${args.getRequest().url} interceptor: ${this.name}`);
  }

  protected noResultFromInterceptorError(args: HttpArgumentsHost, interceptorName: string): Error {
    throw new LogicError(`No Result/AsyncResult return from interceptor: ${this.name}.${interceptorName} route: ${args.getRequest().url}`);
  }

  protected async unwarpResult(data: SAR<any>): Promise<any> {
    const result = data instanceof AsyncResult ? await data : (data as R<any>);

    if (result.isError()) {
      return this.onErrorResult(result);
    }

    return result.v;
  }

  protected onErrorResult(result: R<any>): any {
    if (result.e.code >= HttpStatus.INTERNAL_SERVER_ERROR || result.e.error) {
      this.logger.log(result.e);
    }

    return createErrorResponseBody(result.e);
  }
}
