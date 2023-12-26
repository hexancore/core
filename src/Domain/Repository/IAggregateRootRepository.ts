import { AR, OneOrIterable } from '@hexancore/common';
import { AnyAggregateRoot } from '../Entity/AbstractAggregateRoot';
import { EntityIdTypeOf } from '../Entity/AbstractEntityCommon';
import { GetQueryOptions } from '../../Infrastructure/Persistence/Domain/Generic/Persister';

export interface IAggregateRootRepository<T extends AnyAggregateRoot> {
  persist(entity: OneOrIterable<T>): AR<boolean>;
  getById(id: EntityIdTypeOf<T>): AR<T>;
  getAll(options?: GetQueryOptions<T>): AR<Iterable<T>>;
  getAllAsArray(options?: GetQueryOptions<T>): AR<T[]>;
}
