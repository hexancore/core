import { AR } from '@hexancore/common';
import { AbstractEntityPersister, GetQueryOptions, OneOrIterable } from './Persister/AbstractEntityPersister';
import { AbstractEntityCommon, EntityMetaCommon, ENTITY_META_PROPERTY } from '../../../../Domain/Entity';
import { IEntityPersisterFactory } from './Persister/IEntityPersisterFactory';

export const DOMAIN_ERRORS_PROPERTY = "__HC_DOMAIN_ERRORS_PROPERTY";

/**
 * Abstract base for entity and AggregateRoot repositries
 */
export abstract class AbstractEntityRepositoryCommon<
  T extends AbstractEntityCommon<any>,
  P extends AbstractEntityPersister<T, M>,
  M extends EntityMetaCommon<T>,
> {
  protected persister: P;

  public constructor(persisterFactory: IEntityPersisterFactory) {
    this.persister = persisterFactory.create(this);
  }

  public persist(entity: OneOrIterable<T>): AR<boolean> {
    return this.persister.persist(entity);
  }

  public getAll(options?: GetQueryOptions<T>): AR<Iterable<T>> {
    return this.persister.getAll(options);
  }

  public getAllAsArray(options?: GetQueryOptions<T>): AR<T[]> {
    return this.getAll(options).map((entities: Iterable<T>) => Array.from(entities));
  }

  public get ENTITY_META(): M {
    return this.constructor[ENTITY_META_PROPERTY] as any;
  }

  protected ENTITY_ERRA<T>(type: string, data?: any): AR<T> {
    return this.persister.ENTITY_ERRA(type, data);
  }
}
