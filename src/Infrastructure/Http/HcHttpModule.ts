import { HttpOrderedInterceptorGroup } from '@/Infrastructure/Http/HttpOrderedInterceptorGroup';
import { Global, MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_INTERCEPTOR, HttpAdapterHost } from '@nestjs/core';
import { CookieParserMiddleware } from './CookieParserMiddleware';
import { FastifyAdapter } from '@nestjs/platform-fastify';

export const APP_ORDERED_INTERCEPTOR_GROUP_TOKEN = 'HC_APP_ORDERED_INTERCEPTOR_GROUP';
@Global()
@Module({
  providers: [
    {
      provide: APP_ORDERED_INTERCEPTOR_GROUP_TOKEN,
      useFactory: () => {
        return new HttpOrderedInterceptorGroup('http', true);
      },
    },
    {
      provide: APP_INTERCEPTOR,
      useExisting: APP_ORDERED_INTERCEPTOR_GROUP_TOKEN,
    },
  ],
  exports: [APP_ORDERED_INTERCEPTOR_GROUP_TOKEN],
})
export class HcHttpModule implements NestModule {

  private adapter: FastifyAdapter;

  public constructor(adapter: HttpAdapterHost) {
    this.adapter = adapter.httpAdapter as unknown as FastifyAdapter;
  }

  public async configure(consumer: MiddlewareConsumer): Promise<any> {

    this.adapter.getInstance().addHook('preHandler', (req,_res,next) => {
      req['cookies'] = req.raw["cookies"];
      req['session'] = req.raw["session"];
      next();
    });

    consumer.apply(CookieParserMiddleware).forRoutes({ path: '(.*)', method: RequestMethod.ALL });
  }
}
