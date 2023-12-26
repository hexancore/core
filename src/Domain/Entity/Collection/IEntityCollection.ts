import { AR, ARP, GetQueryOptions, R } from '@hexancore/common';
import { AggregateRootIdTypeOf, AggregateRootOf, AnyEntity } from '../AbstractEntity';
import { EntityIdTypeOf } from '../AbstractEntityCommon';
import { EntityCollectionQueries } from './EntityCollectionQueries';

/**
 * EntityCollection can be used to manage entities in AggregateRoot
 *
 */
export interface IEntityCollection<T extends AnyEntity, Q extends EntityCollectionQueries<T> = EntityCollectionQueries<T>>
  extends AsyncIterable<R<T>> {
  readonly root: AggregateRootOf<T>;
  get rootId(): AggregateRootIdTypeOf<T>;
  readonly rootIdProperty: string;

  add(entity: T): void;
  update(entity: T): void;
  remove(entity: T): void;

  get waitingAdd(): ReadonlyArray<T>;
  get waitingUpdate(): ReadonlyArray<T>;
  get waitingRemove(): ReadonlyArray<T>;

  clearWaiting(): void;
  q?: Q;

  all(options?: GetQueryOptions<T>): AsyncGenerator<R<T>, void, void>;
  getAllAsArray(options?: GetQueryOptions<T>): ARP<T[]>;
  getById(id: EntityIdTypeOf<T>): AR<T>;
}
