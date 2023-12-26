/* eslint-disable @typescript-eslint/ban-types */
import { EntityCollectionImpl } from './EntityCollectionImpl';
import { AnyEntity, EntityConstructor } from '../AbstractEntity';
import { ENTITY_META, EntityCollectionMeta } from '../EntityDecorator';

/**
 * Used in persistance implementations
 */
export const ENTITY_COLLECTIONS_META_PROPERTY = '__HC_ENTITY_COLLECTIONS';

/**
 * Decorator
 * @param rootIdPropertyName
 * @returns
 */
export const EntityCollection =
  (entityClass: EntityConstructor): any =>
  (target: Object, propertyKey: string, descriptor) => {
    const symbol = Symbol(entityClass.name + 'Collection');

    if (!target.constructor[ENTITY_COLLECTIONS_META_PROPERTY]) {
      target.constructor[ENTITY_COLLECTIONS_META_PROPERTY] = new Map<string, EntityCollectionMeta<AnyEntity>>();
    }
    target.constructor[ENTITY_COLLECTIONS_META_PROPERTY].set(entityClass.name, new EntityCollectionMeta(entityClass, propertyKey));
    ENTITY_META(entityClass).aggregateRootClassProvider = () => target.constructor as any;

    target.constructor.prototype[symbol] = descriptor
      ? typeof descriptor.initializer !== 'undefined'
        ? descriptor.initializer()
        : undefined
      : undefined;
    return {
      configurable: true,
      enumerable: true,

      get() {
        if (!this[symbol]) {
          this[symbol] = new EntityCollectionImpl(this);
        }
        return this[symbol];
      },
    };
  };
