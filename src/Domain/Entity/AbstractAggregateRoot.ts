/* eslint-disable @typescript-eslint/ban-types */
import { AbstractValueObject } from '@hexancore/common';
import { AbstractEntityCommon, ENTITY_META_PROPERTY } from './AbstractEntityCommon';

/**
 * Base of AggregateRoot in domain
 */
export abstract class AbstractAggregateRoot<ID extends AbstractValueObject<ID>> extends AbstractEntityCommon<ID> {}

/**
 * Decorator
 * @param moduleName Name of module
 */
export function AggregateRoot(moduleName: string): (constructor: Function) => void {
  return function (constructor: Function) {
    constructor[ENTITY_META_PROPERTY] = {
      module: moduleName,
    };
  };
}
