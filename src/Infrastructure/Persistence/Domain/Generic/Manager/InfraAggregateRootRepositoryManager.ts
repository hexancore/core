import { AggregateRootConstructor, AggregateRootMeta, AnyAggregateRoot, ENTITY_META_PROPERTY, IAggregateRootRepository } from '@/Domain';
import { DomainErrors, LogicError } from '@hexancore/common';
import { AbstractAggregateRootRepository, AnyAggregateRootRepository } from '../AbstractAggregateRootRepository';
import { AggregateRootRepositoryConstructor } from '../EntityRepositoryDecorator';
import { IEntityPersisterFactory } from '../Persister';
import { EntityRepositoryManager } from './EntityRepositoryManager';
import { EntityRepositoryManagerCommon } from './EntityRepositoryManagerCommon';
import { DOMAIN_ERRORS_PROPERTY } from '../AbstractEntityRepositoryCommon';
import { HcAppModuleMeta } from '@/Util/ModuleHelper';

export class InfraAggregateRootRepositoryManager extends EntityRepositoryManagerCommon<
  AnyAggregateRootRepository,
  ConstructorParameters<typeof AbstractAggregateRootRepository>['length'],
  AggregateRootConstructor,
  IAggregateRootRepository<AnyAggregateRoot>
> {
  /**
   * @internal
   */
  protected static __repositoryConstructors: Map<string, AggregateRootRepositoryConstructor>;

  protected entityRepositoryManager: EntityRepositoryManager;

  public constructor(
    module: HcAppModuleMeta,
    persisterFactory: IEntityPersisterFactory,
    errors: DomainErrors<any>
  ) {
    super(module, persisterFactory, errors);
    this.entityRepositoryManager = new EntityRepositoryManager(module, persisterFactory, errors);
    this.baseArgs = [this.persisterFactory, this.entityRepositoryManager];
  }

  protected getRepositoryConstructor(entityClass: AggregateRootConstructor): new (...args: any[]) => any {
    const meta: AggregateRootMeta<AnyAggregateRoot> = entityClass[ENTITY_META_PROPERTY];
    if (meta.module != this.module.name) {
      throw new LogicError('Getting repository for other module aggregate root: ' + meta.fullname);
    }

    const ctr = InfraAggregateRootRepositoryManager.__repositoryConstructors.get(meta.fullname);
    ctr[DOMAIN_ERRORS_PROPERTY] = this.errors;
    return ctr;
  }

  /**
   * @internal
   */
  public static __registerRepositoryConstructor(ctr: AggregateRootRepositoryConstructor): void {
    if (!this.__repositoryConstructors) {
      this.__repositoryConstructors = new Map();
    }

    this.__repositoryConstructors.set(ctr[ENTITY_META_PROPERTY].fullname, ctr);
  }
}
