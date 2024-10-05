/* eslint-disable @typescript-eslint/ban-types */
import { HValueObject } from '@hexancore/common';
import { AbstractAggregateRoot, AggregateRootConstructor } from './AbstractAggregateRoot';
import { AbstractEntityCommon, EntityIdTypeOf } from './AbstractEntityCommon';
import { ENTITY_META_PROPERTY } from './EntityDecorator';

export type AnyEntity = AbstractEntity<any, any>;

/**
 * AggregateRoot id type extractor
 */
export type AggregateRootIdTypeOf<T extends AnyEntity> = T extends AbstractEntity<any, infer U> ? EntityIdTypeOf<U> : T;

/**
 * AggregateRoot type extractor
 */
export type AggregateRootOf<T> = T extends AbstractEntity<any, infer U> ? U : never;

export type EntityConstructor<T extends AnyEntity = AnyEntity> = new (...args: any[]) => T;

/**
 * Base for create Entity attached to selected AggregateRoot type in domain.
 */
export abstract class AbstractEntity<IDT extends HValueObject, ART extends AbstractAggregateRoot<any>> extends AbstractEntityCommon<IDT> {
  public getAggregateRootClass(): AggregateRootConstructor<ART> {
    return this.constructor[ENTITY_META_PROPERTY].aggregateRoot;
  }
}
