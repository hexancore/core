import { AR, AbstractValueObject, AsyncResult, DomainErrors, P, wrapToArray } from '@hexancore/common';
import { EntityCollectionQueries } from '../Entity/Collection/EntityCollectionQueries';
import { AbstractEntity, AggregateRootOf } from '../Entity/AbstractEntity';
import { EntityIdTypeOf } from '../Entity/AbstractEntityCommon';
import { AbstractEntityPersister, CommonEntityRepositoryMeta, ENTITY_REPOSITORY_META_PROPERTY } from './AbstractEntityRepositoryPersister';
import { EntityCollectionInterface, EntityCollectionWaitingChangesCollector } from '../Entity';
import { CommonEntityRepository } from './CommonEntityRepository';

export interface EntityRepositoryMeta extends CommonEntityRepositoryMeta {
  rootCollectionProperty: string;
  rootEntityClass: string;
}

/**
 * Entity Repository base class
 */
export abstract class AbstractEntityRepository<
  T extends AbstractEntity<any, any>,
  P extends AbstractEntityPersister<T, EID>,
  EID extends EntityIdTypeOf<T> = EntityIdTypeOf<T>,
> extends CommonEntityRepository<T, P, EID> {
  public persistCollectionFromRoot(root: AggregateRootOf<T> | AggregateRootOf<T>[]): AR<boolean> {
    const collections: EntityCollectionInterface<T, any>[] = [];
    if (Array.isArray(root)) {
      root.reduce((collected: any[], root: any) => {
        collected.push(root[this.META.rootCollectionProperty]);
        return collected;
      }, collections);
    } else {
      collections.push(root[this.META.rootCollectionProperty]);
    }

    const collector = EntityCollectionWaitingChangesCollector.collectFrom(collections);
    return this.persist(collector.waitingAdd).onOk(() =>
      this.persist(collector.waitingUpdate).onOk(() => this.persister.delete(collector.waitingRemove).mapToTrue()),
    );
  }

  public injectCollectionQueries(entity: AggregateRootOf<T> | AggregateRootOf<T>[]): void {
    const entities = wrapToArray(entity);
    entities.forEach((r: any) => {
      r[this.META.rootCollectionProperty].__queries = this.createCollectionQueries();
    });
  }

  /**
   * Must create generic queries from persistance compatible lib or customized
   */
  protected abstract createCollectionQueries(): EntityCollectionQueries<T, EID>;

  protected get META(): EntityRepositoryMeta {
    return this.constructor[ENTITY_REPOSITORY_META_PROPERTY];
  }
}
