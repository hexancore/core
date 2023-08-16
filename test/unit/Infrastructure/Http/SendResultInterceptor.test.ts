import { firstValueFrom } from 'rxjs';
import { OK } from '@hexancore/common';
import { SendResultInterceptor } from '@/Infrastructure/Http/SendResultInterceptor';
import { MockResponse } from '@/Test/Http/MockResponse';
import { ExecutionContextTestHelper } from '@/Test/Http/ExecutionContextTestHelper';

describe('SendResultInterceptor', () => {
  let interceptor: SendResultInterceptor;

  beforeEach(async () => {
    interceptor = new SendResultInterceptor();
  });

  test('should throw an error if the returned data is not an instance of Result', async () => {
    const response = new MockResponse();
    const context = ExecutionContextTestHelper.createHttp(response);
    const next = ExecutionContextTestHelper.createCallHandler({});

    const current = firstValueFrom(interceptor.intercept(context, next));

    await expect(current).rejects.toThrow('Not Result instance returned from controller: http://example.test/test');
  });

  test('send result from next', async () => {
    const response = new MockResponse();
    const context = ExecutionContextTestHelper.createHttp(response);
    const next = ExecutionContextTestHelper.createCallHandler(OK({ data: 'example' }));

    const current = await firstValueFrom(interceptor.intercept(context, next));

    response.expectStatusCodeToEqual(200);
    response.expectBodyToEqual({ data: 'example' })
    expect(current).toBeNull();
  });
});
