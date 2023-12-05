import { AR, Result } from '@hexancore/common';
import { AbstractEntity } from '../AbstractEntity';
import { EntityIdTypeOf } from '../AbstractEntityCommon';
import { EntityCollectionQueries } from './EntityCollectionQueries';

/**
 * EntityCollection can be used to manage entities in AggregateRoot
 *
 */
export interface EntityCollectionInterface<
  T extends AbstractEntity<any, any>,
  EID = EntityIdTypeOf<T>,
  ECQ extends EntityCollectionQueries<T, EID> = EntityCollectionQueries<T>,
> extends AsyncIterable<Result<T>> {
  add(entity: T): void;
  update(entity: T): void;
  remove(entity: T): void;

  get waitingAdd(): ReadonlyArray<T>;
  get waitingUpdate(): ReadonlyArray<T>;
  get waitingRemove(): ReadonlyArray<T>;

  clearWaiting(): void;
  q?: ECQ;

  all(): AsyncGenerator<Result<T>, void, void>;
  getAllAsArray(): Promise<Result<T[]>>;
  getById(id: EID): AR<T>;
}
