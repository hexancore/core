import { AR, ARP, OK, OKAP } from '@hexancore/common';
import { AggregateRootMeta, EntityConstructor, EntityIdTypeOf } from '../../../../Domain/Entity';
import { AnyAggregateRoot, AnyEntityOfAggregateRoot } from '../../../../Domain/Entity/AbstractAggregateRoot';
import { AbstractEntityRepository } from './AbstractEntityRepository';
import { AbstractEntityRepositoryCommon } from './AbstractEntityRepositoryCommon';
import { IAggregateRootRepository } from '../../../../Domain/Repository/IAggregateRootRepository';
import { EntityRepositoryManager } from './Manager/EntityRepositoryManager';
import { AbstractEntityPersister, GetQueryOptions, OneOrIterable } from './Persister/AbstractEntityPersister';
import { IEntityPersisterFactory } from './Persister/IEntityPersisterFactory';

export type AnyAggregateRootRepository = AbstractAggregateRootRepository<AnyAggregateRoot, any>;
/**
 * Aggregate root entity repository base class
 */
export abstract class AbstractAggregateRootRepository<T extends AnyAggregateRoot, P extends AbstractEntityPersister<T, AggregateRootMeta<T>>>
  extends AbstractEntityRepositoryCommon<T, P, AggregateRootMeta<T>>
  implements IAggregateRootRepository<T>
{
  public constructor(persisterFactory: IEntityPersisterFactory, protected entityRepositoryManager: EntityRepositoryManager) {
    super(persisterFactory);
  }

  public abstract getById(id: EntityIdTypeOf<T>): AR<T>;

  public persist(entity: OneOrIterable<T>): AR<boolean> {
    return super
      .persist(entity)
      .onOk(() => {
        return this.persistCollections(entity);
      })
      .onOk(() => {
        this.injectCollectionQueries(entity);
        return OK(true);
      });
  }

  public getAll(options?: GetQueryOptions<T>): AR<Iterable<T>> {
    return super.getAll(options).onOk((entity) => {
      return OK(this.injectCollectionQueries(entity));
    });
  }

  protected async persistCollections(entity: OneOrIterable<T>): ARP<boolean> {
    for (const [_key, collectionMeta] of this.ENTITY_META.collections) {
      const result = await this.getEntityRepository(collectionMeta.entityClass).persistCollectionFromRoot(entity);
      if (result.isError()) {
        return result;
      }
    }
    return OKAP(true);
  }

  protected injectCollectionQueries(entity: OneOrIterable<T>): Iterable<T> {
    for (const [_key, collectionMeta] of this.ENTITY_META.collections) {
      entity = this.getEntityRepository(collectionMeta.entityClass).injectCollectionQueries(entity);
    }
    return entity as any;
  }

  protected getEntityRepository<R extends AbstractEntityRepository<AnyEntityOfAggregateRoot<T>, any>>(
    entityClass: EntityConstructor<AnyEntityOfAggregateRoot<T>>,
  ): R {
    return this.entityRepositoryManager.get(entityClass);
  }
}
