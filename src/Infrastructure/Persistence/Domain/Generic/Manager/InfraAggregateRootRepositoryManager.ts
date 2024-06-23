import { AggregateRootConstructor, AggregateRootMeta, AnyAggregateRoot, ENTITY_META_PROPERTY, IAggregateRootRepository } from '../../../../../Domain';
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

  protected static repositoryConstructors: Map<string, AggregateRootRepositoryConstructor>;
  protected static modulesRepositoryConstructors: Map<string, Map<string, AggregateRootRepositoryConstructor>>;

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

    const ctr = InfraAggregateRootRepositoryManager.repositoryConstructors.get(meta.fullname);
    if (!ctr) {
      throw new LogicError('Missing aggregate root repository constructor of: ' + meta.fullname);
    }

    ctr[DOMAIN_ERRORS_PROPERTY] = this.errors;
    return ctr;
  }

  /**
   * @internal
   */
  public static __registerRepositoryConstructor(ctr: AggregateRootRepositoryConstructor): void {
    if (!this.repositoryConstructors) {
      this.repositoryConstructors = new Map();
      this.modulesRepositoryConstructors = new Map();
    }

    const meta: AggregateRootMeta<AnyAggregateRoot> = ctr[ENTITY_META_PROPERTY];
    this.repositoryConstructors.set(meta.fullname, ctr);

    let modulesRepositoryCtrs = this.modulesRepositoryConstructors.get(meta.module);
    if (!modulesRepositoryCtrs) {
      modulesRepositoryCtrs = new Map();
      this.modulesRepositoryConstructors.set(meta.module, modulesRepositoryCtrs);
    }

    modulesRepositoryCtrs.set(meta.name, ctr);
  }

  public static getModuleAggregateRootMetas(module: string): AggregateRootMeta<AnyAggregateRoot>[] {
    const constructors = this.modulesRepositoryConstructors.get(module);
    if (!constructors) {
      return [];
    }

    return Array.from(constructors.values()).map((c) => c[ENTITY_META_PROPERTY]);
  }
}
