import { AR } from '@hexancore/common';
import {
  AggregateRootIdTypeOf,
  AnyEntity,
  EntityCollectionQueries,
  EntityIdTypeOf,
  EntityMeta,
} from '../../../../Domain';
import { MemoryEntityCollectionQueries } from './MemoryEntityCollectionQueries';
import { MemoryEntityPersister } from './MemoryEntityPersister';
import { AbstractEntityRepository, IEntityPersisterFactory } from '../Generic';

export abstract class MemoryEntityRepository<T extends AnyEntity> extends AbstractEntityRepository<
  T,
  MemoryEntityPersister<T, EntityMeta<T>>
> {
  public constructor(persisterFactory: IEntityPersisterFactory) {
    super(persisterFactory);
  }

  public getBy(criteria: Record<string, any>): AR<T[]> {
    return this.persister.getBy(criteria);
  }

  public getById(id: EntityIdTypeOf<T>, _rootId: AggregateRootIdTypeOf<T>): AR<T> {
    return this.persister.getOneBy({ id });
  }

  protected createCollectionQueries(): EntityCollectionQueries<T> {
    return new MemoryEntityCollectionQueries(this);
  }
}
