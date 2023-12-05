/* eslint-disable @typescript-eslint/ban-types */
import { AbstractValueObject } from '@hexancore/common';
import { AbstractAggregateRoot } from './AbstractAggregateRoot';
import { AbstractEntityCommon, EntityIdTypeOf, ENTITY_META_PROPERTY } from './AbstractEntityCommon';

/**
 * AggregateRoot type extractor
 */
export type AggregateRootOf<T extends AbstractEntity<any, any>> = T extends AbstractEntity<any, infer U> ? U : T;

/**
 * AggregateRoot id type extractor
 */
export type AggregateRootIdTypeOf<T extends AbstractEntity<any, any>> = T extends AbstractEntity<any, infer U> ? EntityIdTypeOf<U> : T;

/**
 * Base for create Entity attached to selected AggregateRoot type in domain.
 */
export abstract class AbstractEntity<
  IDT extends AbstractValueObject<IDT>,
  ART extends AbstractAggregateRoot<any>,
> extends AbstractEntityCommon<IDT> {}

/**
 * Decorator
 * @param moduleName Name of module
 */
export function Entity(moduleName: string): (constructor: Function) => void {
  return function (constructor: Function) {
    constructor[ENTITY_META_PROPERTY] = {
      module: moduleName,
    };
  };
}
