import { AR } from '@hexancore/common';
import { AbstractAggregateRoot } from '../Entity/AbstractAggregateRoot';
import { EntityIdTypeOf } from '../Entity/AbstractEntityCommon';

export interface AggregateRootRepositoryInterface<T extends AbstractAggregateRoot<any>> {
  persist(entity: T | T[]): AR<boolean>;
  getById(id: EntityIdTypeOf<T>): AR<T>;
  getAll(): AR<Iterable<T>>;
  getAllAsArray(): AR<T[]>;
}
