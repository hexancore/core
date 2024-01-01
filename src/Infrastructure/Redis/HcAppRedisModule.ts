import { Global, Inject, Module } from '@nestjs/common';
import { ClusterManager, ClusterModule, ClusterModuleOptions } from '@liaoliaots/nestjs-redis';
import { ConfigService } from '@nestjs/config';
import { Cluster, DNSLookupFunction } from 'ioredis';
import { SecretsService } from '../Config/SecretsService';
import { AppMeta, getLogger } from '@hexancore/common';

export const APP_REDIS_TOKEN = 'HC_APP_REDIS';
export const REDIS_DNS_LOOKUP_TOKEN = 'HC_REDIS_DNS_LOOKUP';

export const localhostDnsLookup: DNSLookupFunction = (_address, callback) => callback(null, 'localhost');

export const clusterModuleRoot = ClusterModule.forRootAsync(
  {
    inject: [ConfigService, SecretsService, { token: REDIS_DNS_LOOKUP_TOKEN, optional: true }],
    useFactory: async (c: ConfigService, secrets: SecretsService, dnsLookup?: DNSLookupFunction): Promise<ClusterModuleOptions> => {
      const LOGGER = getLogger('core.infra.redis', ['core', 'infra', 'redis']);
      const redisConfig = c.get('core.redis');
      dnsLookup = dnsLookup ?? (AppMeta.get().isTest() || AppMeta.get().isDev() ? localhostDnsLookup : undefined);
      const secretGetResult = secrets.getAsBasicAuth('core.redis');
      if (secretGetResult.isError()) {
        secretGetResult.e.panic();
      }
      const auth = secretGetResult.v;

      const retryOptions = {
        warnEveryXTimes: redisConfig.retry?.warnEveryXTimes ?? 5,
        firstRetryDelayMs: redisConfig.retry?.firstRetryDelayMs ?? 3000,
        retryDelayMultiplerMs: redisConfig.retry?.retryDelayMultiplerMs ?? 5000,
        maxRetryDelayMs: redisConfig.retry?.maxRetryDelayMs ?? 1 * 60 * 1000,
      };

      return {
        config: {
          slotsRefreshTimeout: redisConfig.slotsRefreshTimeout,
          clusterRetryStrategy(times, reason) {
            const nextDelay = Math.min(retryOptions.firstRetryDelayMs + times * retryOptions.retryDelayMultiplerMs, retryOptions.maxRetryDelayMs);
            if (times % retryOptions.warnEveryXTimes === 0) {
              LOGGER.warn(`Reconnected redis times: ${times} reason: ${reason} next delay: ${nextDelay} ms`, { times, nextDelay, reason });
            }

            return nextDelay;
          },
          nodes: redisConfig.nodes,
          dnsLookup,
          redisOptions: {
            ...redisConfig.options,
            ...auth,
          },
        },
      };
    },
  },
  true,
);

export const InjectAppRedis = (): PropertyDecorator & ParameterDecorator => Inject(APP_REDIS_TOKEN);

export const HcAppRedisProvider = {
  provide: APP_REDIS_TOKEN,
  inject: [ClusterManager],
  useFactory: (cm: ClusterManager): Cluster => cm.getClient(),
};
@Global()
@Module({
  imports: [clusterModuleRoot],
  providers: [HcAppRedisProvider],
  exports: [HcAppRedisProvider],
})
export class HcAppRedisModule {}
