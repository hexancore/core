import { LogicError } from '@hexancore/common';
import { AnyEntity, ENTITY_META_PROPERTY, EntityConstructor, EntityMeta } from '../../../../../Domain/Entity';
import { AbstractEntityRepository, AnyEntityRepository } from '../AbstractEntityRepository';
import { EntityRepositoryConstructor } from '../EntityRepositoryDecorator';
import { EntityRepositoryManagerCommon } from './EntityRepositoryManagerCommon';
import { DOMAIN_ERRORS_PROPERTY } from '../AbstractEntityRepositoryCommon';

/**
 * @internal
 */
export class EntityRepositoryManager extends EntityRepositoryManagerCommon<
  AnyEntityRepository,
  ConstructorParameters<typeof AbstractEntityRepository>['length'],
  EntityConstructor
> {
  /**
   * @internal
   */
  public static __repositoryConstructors: Map<string, EntityRepositoryConstructor>;

  /**
   * @internal
   */
  public static __registerRepositoryConstructor(ctr: EntityRepositoryConstructor): void {
    if (!this.__repositoryConstructors) {
      this.__repositoryConstructors = new Map();
    }

    this.__repositoryConstructors.set(ctr[ENTITY_META_PROPERTY].fullname, ctr);
  }

  protected getRepositoryConstructor(entityClass: EntityConstructor): new (...args: any[]) => any {
    const meta: EntityMeta<AnyEntity> = entityClass[ENTITY_META_PROPERTY];
    if (meta.module != this.featureName) {
      throw new LogicError(`Getting entity repository from other Feature: ${meta.fullname} in ${this.featureName}`);
    }

    const ctr = EntityRepositoryManager.__repositoryConstructors.get(meta.fullname);
    if (!ctr) {
      throw new LogicError('Missing entity repository constructor of: ' + meta.fullname);
    }

    ctr[DOMAIN_ERRORS_PROPERTY] = this.errors;
    return ctr;
  }
}
