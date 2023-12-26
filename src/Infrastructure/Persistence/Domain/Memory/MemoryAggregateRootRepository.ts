import { AR } from '@hexancore/common';
import {
  AbstractAggregateRoot,
  AggregateRootMeta,
  EntityIdTypeOf,
} from '../../../../Domain';
import { EntityRepositoryManager } from '../Generic/Manager';
import { MemoryEntityPersister } from './MemoryEntityPersister';
import { AbstractAggregateRootRepository, IEntityPersisterFactory } from '../Generic';

export abstract class MemoryAggregateRootRepository<T extends AbstractAggregateRoot<any>> extends AbstractAggregateRootRepository<
  T,
  MemoryEntityPersister<T, AggregateRootMeta<T>>
> {
  public constructor(persisterFactory: IEntityPersisterFactory, entityRepositoryManager: EntityRepositoryManager) {
    super(persisterFactory, entityRepositoryManager);
  }

  public getById(id: EntityIdTypeOf<T>): AR<T> {
    return this.persister.getOneBy({ id });
  }
}
