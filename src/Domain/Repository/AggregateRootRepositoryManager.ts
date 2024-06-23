import { InfraAggregateRootRepositoryManager } from '@/Infrastructure/Persistence/Domain/Generic/Manager/InfraAggregateRootRepositoryManager';
import { AggregateRootConstructor, AnyAggregateRoot } from '../Entity';
import { IAggregateRootRepository } from './IAggregateRootRepository';
import { Injectable } from '@nestjs/common';

/**
 * Manager to access aggregate root repositories in Application and Infrastructure layers.
 */
@Injectable()
export class AggregateRootRepositoryManager {
  public constructor(private infra: InfraAggregateRootRepositoryManager) { }

  public get<R extends IAggregateRootRepository<AnyAggregateRoot>>(entityClass: AggregateRootConstructor): R {
    return this.infra.get(entityClass);
  }
}
