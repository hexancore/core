import { AbstractAggregateRoot } from '../Entity/AbstractAggregateRoot';
import { AbstractEntityPersister, CommonEntityRepositoryMeta, ENTITY_REPOSITORY_META_PROPERTY } from './AbstractEntityRepositoryPersister';
import { CommonEntityRepository } from './CommonEntityRepository';
import { EntityIdTypeOf } from '../Entity';

type AggregateRootRepositoryMeta = CommonEntityRepositoryMeta;

/**
 * Aggregate root entity repository base class
 */
export abstract class AbstractAggregateRootRepository<
  T extends AbstractAggregateRoot<any>,
  P extends AbstractEntityPersister<T>,
  EID extends EntityIdTypeOf<T> = EntityIdTypeOf<T>,
> extends CommonEntityRepository<T, P> {
  protected get META(): AggregateRootRepositoryMeta {
    return this.constructor[ENTITY_REPOSITORY_META_PROPERTY];
  }
}
