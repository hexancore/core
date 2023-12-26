import { AR, OK, isIterable } from '@hexancore/common';
import { EntityCollectionWaitingChangesCollector, EntityMeta, IEntityCollection } from '../../../../Domain/Entity';
import { AbstractEntity, AggregateRootIdTypeOf, AggregateRootOf } from '../../../../Domain/Entity/AbstractEntity';
import { EntityIdTypeOf } from '../../../../Domain/Entity/AbstractEntityCommon';
import { EntityCollectionQueries } from '../../../../Domain/Entity/Collection/EntityCollectionQueries';
import { AbstractEntityRepositoryCommon } from './AbstractEntityRepositoryCommon';
import { AbstractEntityPersister, OneOrIterable } from './Persister/AbstractEntityPersister';

export type AnyEntityRepository = AbstractEntityRepository<any, any>;
/**
 * Entity Repository base class
 */
export abstract class AbstractEntityRepository<
  T extends AbstractEntity<any, any>,
  P extends AbstractEntityPersister<T, EntityMeta<T>>,
> extends AbstractEntityRepositoryCommon<T, P, EntityMeta<T>> {
  /**
   * Persists entity collection from AggregateRoot
   * @param entity
   * @returns true when success
   */
  public persistCollectionFromRoot(entity: OneOrIterable<AggregateRootOf<T>>): AR<boolean> {
    const collections = this.collectCollection(entity);

    const collector = EntityCollectionWaitingChangesCollector.collectFrom(collections);
    return this.persist(collector.waitingAdd).onOk(() =>
      this.persist(collector.waitingUpdate)
        .onOk(() => this.persister.delete(collector.waitingRemove))
        .onOk(() => {
          this.injectCollectionQueries(entity);
          return OK(true);
        }),
    );
  }

  protected collectCollection(entity: OneOrIterable<AggregateRootOf<T>>): IEntityCollection<T, any>[] {
    const collectionProperty = this.ENTITY_META.rootCollectionProperty;
    if (isIterable(entity)) {
      const collected = [];
      for (const e of entity as Iterable<AggregateRootOf<T>>) {
        collected.push(e[collectionProperty]);
      }
      return collected;
    } else {
      return [entity[collectionProperty]];
    }
  }

  public *injectCollectionQueries(entity: OneOrIterable<AggregateRootOf<T>>): Generator<AggregateRootOf<T>> {
    const collectionProperty = this.ENTITY_META.rootCollectionProperty;
    const entities: Iterable<AggregateRootOf<T>> = isIterable(entity) ? entity : ([entity] as any);
    for (const entity of entities) {
      if (entity[collectionProperty].q === undefined) {
        entity[collectionProperty].__queries = this.createCollectionQueries();
      }
      yield entity;
    }
  }

  /**
   * Returns entity found by id
   * @param id Id of entity
   * @param rootId Aggregate root id of entity
   */
  public abstract getById(id: EntityIdTypeOf<T>, rootId: AggregateRootIdTypeOf<T>): AR<T>;

  /**
   * Must create generic queries from persistance compatible lib or customized
   */
  protected abstract createCollectionQueries(): EntityCollectionQueries<T>;
}
