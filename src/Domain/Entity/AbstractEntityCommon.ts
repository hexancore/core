import { AbstractValueObject } from '@hexancore/common';

/**
 * Entity Id type alias
 */
export type EntityIdTypeOf<T extends AbstractEntityCommon<any>> = T extends AbstractEntityCommon<infer U> ? U : T;

/**
 * Common base of Entity and AggregateRoot
 * Can track changes in entity for use in persistance libs
 */
export abstract class AbstractEntityCommon<ID extends AbstractValueObject<ID>> {
  /**
   * Entity id
   */
  public id?: ID;

  /**
   * managed on infrastructure level by persistance layer like typeorm
   */
  public __tracked: boolean;

  /**
   * Tracks entity property modification
   */
  public __modifiedProperties: Set<string>;

  /**
   * Always use `return this.proxify()` in child class
   */
  public constructor() {
    this.__tracked = false;
  }

  protected proxify(): this {
    return new Proxy(this, {
      set: (target, prop: string, val) => {
        if (target.__tracked && !['__tracked', '__modifiedProperties'].includes(prop)) {
          if (!this.__modifiedProperties) {
            this.__modifiedProperties = new Set();
          }
          target.__modifiedProperties.add(prop);
        }
        target[prop] = val;
        return true;
      },
    });
  }

  /**
   * @return true if entity has any property changes
   */
  public get __modified(): boolean {
    return this.__modifiedProperties && this.__modifiedProperties.size > 0;
  }

  public __track(): void {
    this.__modifiedProperties = undefined;
    this.__tracked = true;
  }

  public static markAsTracked<T extends AbstractEntityCommon<any>>(entities: T[]): void {
    entities.forEach((e: T) => {
      e.__track();
    });
  }
}
