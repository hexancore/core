/**
 * @group unit
 */
import { OK } from '@hexancore/common';
import { HttpOrderedInterceptorGroup } from '@/Infrastructure/Http/HttpOrderedInterceptorGroup';
import { HttpInterceptorTestWrapper } from '@/Test';
import { mock } from '@hexancore/mocker';
import { GroupableInterceptor } from '@';

describe('HttpOrderedInterceptorGroup ', () => {
  let interceptor: HttpInterceptorTestWrapper<HttpOrderedInterceptorGroup>;

  beforeEach(() => {
    interceptor = HttpInterceptorTestWrapper.wrap(new HttpOrderedInterceptorGroup("test_group_name", true));
  });

  describe('intercept', () => {

    test('should throw an error if the returned data is not an instance of Result', async () => {
      await expect(interceptor.intercept(null)).rejects.toThrow('');
    });

    test('should return last data if unwarpResult is true', async () => {
      const current = await interceptor.intercept(OK("test"));

      expect(current).toEqual('test');
    });

    test('should return data from last interceptor if unwarpResult is true', async () => {
      const i1 = mock<GroupableInterceptor<any, any, any>>('i1');
      i1.expects('getName').andReturn("i1");
      interceptor.w.add(1, i1.i);

      const routeData = OK("test");

      i1.expects('beforeRoute', expect.anything()).andReturn(OK(true));
      i1.expects('afterRoute', interceptor.context, expect.anything()).andReturnWith((_args, data) => {
        expect(data).toBe(routeData);
        return data.onOk(() => 'after_i1');
      });

      const current = await interceptor.intercept<string>(routeData);

      expect(current).toEqual('after_i1');
    });

    test("should return last result if unwarpResult is false", async () => {
      interceptor = HttpInterceptorTestWrapper.wrap(new HttpOrderedInterceptorGroup("test_group_name", false));

      const routeData = OK("test");
      const current = await interceptor.intercept(routeData);

      expect(current).toBe(routeData);
    });
  });



});
