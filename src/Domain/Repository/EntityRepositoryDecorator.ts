import { pascalCaseToCamelCase, pascalCaseToSnakeCase } from '@hexancore/common';
import { ENTITY_REPOSITORY_META_PROPERTY } from './AbstractEntityRepositoryPersister';

export interface EntityRepositoryOptions {
  moduleName: string;
  entityClass: Function;
  rootEntityClass: Function;
  rootCollectionProperty?: string;
}

/**
 * Decorator
 * @param moduleName Name of module
 * @param entityClass Entity class
 * @param rootEntityClass Root entity class
 */
export function EntityRepository(options: EntityRepositoryOptions): (constructor: Function) => void {
  return function (constructor: Function) {
    constructor[ENTITY_REPOSITORY_META_PROPERTY] = {
      module: options.moduleName,
      entityClass: options.entityClass,
      entityName: options.entityClass.name,
      entityNameSnake: pascalCaseToSnakeCase(options.entityClass.name),
      rootEntityClass: options.rootEntityClass,
      rootCollectionProperty: options.rootCollectionProperty ?? pascalCaseToCamelCase(options.entityClass.name) + 's',
    };
  };
}

/**
 * Decorator
 * @param moduleName Name of module
 * @param entityClass Entity class
 */
export function AggregateRootRepository(moduleName: string, entityClass: Function): (constructor: Function) => void {
  return function (constructor: Function) {
    constructor[ENTITY_REPOSITORY_META_PROPERTY] = {
      module: moduleName,
      entityClass: entityClass,
      entityName: entityClass.name,
      entityNameSnake: pascalCaseToSnakeCase(entityClass.name),
    };
  };
}
