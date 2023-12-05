import { AR } from '@hexancore/common';
import { AbstractEntity, AbstractEntityRepository, EntityCollectionQueries } from '../../../Domain';
import { MemoryEntityRepositoryPersister } from './MemoryEntityRepositoryPersister';
import { MemoryEntityCollectionQueries } from './MemoryEntityCollectionQueries';

export abstract class MemoryEntityRepository<T extends AbstractEntity<any, any>> extends AbstractEntityRepository<
  T,
  MemoryEntityRepositoryPersister<T>
> {
  public constructor() {
    super();
    this.persister = new MemoryEntityRepositoryPersister(this.META, this.getDomainErrors());
  }

  public getBy(criteria: Record<string, any>): AR<T[]> {
    return this.persister.getBy(criteria);
  }

  protected createCollectionQueries(): EntityCollectionQueries<T> {
    return new MemoryEntityCollectionQueries(this);
  }
}
