/* eslint-disable @typescript-eslint/ban-types */
import { HValueObject } from '@hexancore/common';
import { AbstractEntityCommon } from './AbstractEntityCommon';
import { AbstractEntity } from './AbstractEntity';

export type AnyAggregateRoot = AbstractAggregateRoot<any>;
export type AnyEntityOfAggregateRoot<T extends AnyAggregateRoot> = AbstractEntity<any, T>;
export type AggregateRootConstructor<T extends AnyAggregateRoot = AnyAggregateRoot> = new (...args: any[]) => T;

/**
 * Base of AggregateRoot in domain
 */
export abstract class AbstractAggregateRoot<ID extends HValueObject> extends AbstractEntityCommon<ID> {}
