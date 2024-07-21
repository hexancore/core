import { AggregateRootConstructor, AnyAggregateRoot, AnyEntity, ENTITY_META_PROPERTY, EntityConstructor } from '../../../../Domain/Entity';
import { AnyEntityRepository } from './AbstractEntityRepository';
import { AnyAggregateRootRepository } from './AbstractAggregateRootRepository';
import { EntityRepositoryManager } from './Manager';
import { InfraAggregateRootRepositoryManager } from './Manager/InfraAggregateRootRepositoryManager';

export const ENTITY_REPOSITORY_PERSISTER_TYPE_PROPERTY = '__HC_ENTITY_REPOSITORY_PERSISTER_TYPE';

export type EntityRepositoryConstructor<T extends AnyEntityRepository = AnyEntityRepository> = new (...args: any[]) => T;

/**
 * Decorator
 * @param aggregateRoot Entity class
 * @param persisterType Type of persister
 */
export function EntityRepository<T extends AnyEntity>(
  entity: EntityConstructor<T>,
  persisterType: string,
): (constructor: EntityRepositoryConstructor) => void {
  return function (constructor: any) {
    constructor[ENTITY_META_PROPERTY] = entity[ENTITY_META_PROPERTY];
    constructor[ENTITY_REPOSITORY_PERSISTER_TYPE_PROPERTY] = persisterType;
    EntityRepositoryManager.__registerRepositoryConstructor(constructor);
  };
}

export type AggregateRootRepositoryConstructor<T extends AnyAggregateRootRepository = AnyAggregateRootRepository> = new (...args: any[]) => T;

/**
 * Decorator
 * @param aggregateRoot Aggregate Root class
 * @param persisterType Type of persister
 */
export function AggregateRootRepository<T extends AnyAggregateRoot>(
  aggregateRoot: AggregateRootConstructor<T>,
  persisterType: string,
): (constructor: AggregateRootRepositoryConstructor) => void {
  return function (constructor) {
    constructor[ENTITY_META_PROPERTY] = aggregateRoot[ENTITY_META_PROPERTY];
    constructor[ENTITY_REPOSITORY_PERSISTER_TYPE_PROPERTY] = persisterType;
    InfraAggregateRootRepositoryManager.__registerRepositoryConstructor(constructor);
  };
}
