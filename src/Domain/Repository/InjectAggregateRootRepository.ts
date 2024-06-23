import { Inject } from '@nestjs/common';
import { type AggregateRootConstructor, ENTITY_META_PROPERTY, type AggregateRootMeta, type AnyAggregateRoot } from '../Entity';
import type { IAggregateRootRepository } from './IAggregateRootRepository';

export function getAggregateRootRepositoryToken(aggregateRoot: AggregateRootConstructor): string {
  const fullname = (aggregateRoot[ENTITY_META_PROPERTY] as AggregateRootMeta<any>).fullname;
  return 'HC_AggregateRootRepository_' + fullname;
}

export function InjectAggregateRootRepository<T extends AnyAggregateRoot>(
  aggregateRoot: AggregateRootConstructor<T>,
): ParameterDecorator {
  return Inject(getAggregateRootRepositoryToken(aggregateRoot));
}

/**
 * Type to indicate repository instance is wrapped with Proxy.
 * @public
 */
export type AggregateRootRepositoryProxy<R extends IAggregateRootRepository<AnyAggregateRoot>> = R & {
  proxyUnwrap(): R;
};