import { AR, OneOrIterable } from '@hexancore/common';
import { AnyAggregateRoot, type AggregateRootConstructor } from '../Entity/AbstractAggregateRoot';
import { EntityIdTypeOf } from '../Entity/AbstractEntityCommon';
import { GetQueryOptions } from '../../Infrastructure/Persistence/Domain/Generic/Persister';

export type ExtractAggregateRootConstructorFromRepository<R extends IAggregateRootRepository<AnyAggregateRoot>> = R extends IAggregateRootRepository<infer T> ? AggregateRootConstructor<T> : never;

/**
 * Basic aggregate root repository interface 
 */
export interface IAggregateRootRepository<T extends AnyAggregateRoot> {
  persist(entity: OneOrIterable<T>): AR<boolean>;
  getById(id: EntityIdTypeOf<T>): AR<T>;
  getAll(options?: GetQueryOptions<T>): AR<Iterable<T>>;
  getAllAsArray(options?: GetQueryOptions<T>): AR<T[]>;
}
