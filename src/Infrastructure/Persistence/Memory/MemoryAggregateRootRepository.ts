import { AbstractAggregateRoot, AbstractAggregateRootRepository } from '../../../Domain';
import { MemoryEntityRepositoryPersister } from './MemoryEntityRepositoryPersister';

export abstract class MemoryAggregateRootRepository<T extends AbstractAggregateRoot<any>> extends AbstractAggregateRootRepository<
  T,
  MemoryEntityRepositoryPersister<T>
> {
  public constructor() {
    super();
    this.persister = new MemoryEntityRepositoryPersister(this.META, this.getDomainErrors());
  }
}
