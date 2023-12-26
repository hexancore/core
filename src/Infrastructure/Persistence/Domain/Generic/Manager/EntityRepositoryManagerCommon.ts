import { DomainErrors, LogicError, TupleTail } from '@hexancore/common';
import { AbstractEntityRepositoryCommon } from '../AbstractEntityRepositoryCommon';
import { IEntityPersisterFactory } from '../Persister/IEntityPersisterFactory';
import { AbstractEntityCommon, ENTITY_COMMON_META } from '@/Domain';
import { HcAppModuleMeta } from '@/Util/ModuleHelper';
import { AnyEntityRepository } from '../AbstractEntityRepository';
import { EntityRepositoryConstructor } from '../EntityRepositoryDecorator';

export abstract class EntityRepositoryManagerCommon<
  R extends AbstractEntityRepositoryCommon<any, any, any>,
  RBCN extends number,
  EC extends new (...args: any[]) => AbstractEntityCommon<any>,
  IR = R,
> {
  protected repositories: Map<string, R>;

  protected baseArgs: any[];

  public constructor(
    public readonly module: HcAppModuleMeta,
    protected persisterFactory: IEntityPersisterFactory,
    protected errors: DomainErrors<any>,
  ) {
    this.repositories = new Map();
    this.baseArgs = [this.persisterFactory];
  }

  public get<R extends IR>(entityClass: EC): R {
    const entityName = entityClass['name'];
    let r = this.repositories.get(entityName);
    if (!r) {
      r = this.register(entityClass);
      this.repositories.set(entityName, r);
    }
    return r as any;
  }

  public register<C extends new (...args: any[]) => C = any>(entityClass: EC, ...args: TupleTail<ConstructorParameters<C>, RBCN> | any[]): R {
    if (this.repositories.has(entityClass['name'])) {
      throw new LogicError('Repository was registered before: ' + ENTITY_COMMON_META(entityClass).fullname);
    }

    const ctr = this.getRepositoryConstructor(entityClass);
    return new ctr(...this.baseArgs, ...Array.from(args));
  }

  protected abstract getRepositoryConstructor(entityClass: EC): new (...args: any[]) => any;
}
