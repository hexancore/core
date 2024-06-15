import { HttpOrderedInterceptorGroup } from '@/Infrastructure/Http/HttpOrderedInterceptorGroup';
import { Global, Module} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

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
export class HcHttpModule {}
