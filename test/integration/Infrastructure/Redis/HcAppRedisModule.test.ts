/**
 * @group integration
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Cluster } from 'ioredis';
import { APP_REDIS_TOKEN, HcAppConfigModule, HcAppRedisModule, InjectAppRedis } from '@';
import { Injectable } from '@nestjs/common';

@Injectable()
class T {
  public constructor(@InjectAppRedis() public c: Cluster) {}
}

describe('RedisModule', () => {
  let module: TestingModule;
  let redis: Cluster;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [HcAppConfigModule, HcAppRedisModule],
      providers: [T],
    }).compile();
    module.enableShutdownHooks();
    await module.init();
    await module.get<Cluster>(APP_REDIS_TOKEN).set('k2', 1);
    redis = module.get(T).c;
  }, 10000);

  afterAll(async () => {
    if (module) {
      redis = null;
      await module.close();
      module = null;
    }
  });

  test('connected', async () => {
    await redis.set('test', 'test');
    const r = await redis.get('test');

    expect(r).toEqual('test');
  });
});
