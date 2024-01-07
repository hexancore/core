import { pascalCaseToCamelCase, pascalCaseToSnakeCase } from '@hexancore/common';
import { AggregateRootConstructor, AnyAggregateRoot } from './AbstractAggregateRoot';
import { AggregateRootOf, AnyEntity, EntityConstructor } from './AbstractEntity';
import { ENTITY_COLLECTIONS_META_PROPERTY } from './Collection';
import { AbstractEntityCommon } from './AbstractEntityCommon';
import { HcAppModuleMeta } from '@/Util/ModuleHelper';

export const ENTITY_META_PROPERTY = '__HC_ENTITY_META';

export abstract class EntityMetaCommon<T> {
  public name: string;
  public nameSnake: string;

  public constructor(public readonly entityClass: new (...args: any[]) => T) {
    this.name = entityClass.name;
    this.nameSnake = pascalCaseToSnakeCase(entityClass.name);
  }

  public get fullname(): string {
    return this.module + '.' + this.name;
  }

  public get module(): string {
    return this.moduleMeta.name;
  }

  public abstract get moduleMeta(): HcAppModuleMeta;
}

export class EntityMeta<T extends AnyEntity> extends EntityMetaCommon<T> {
  private _aggregateRootClass: AggregateRootConstructor<AggregateRootOf<T>>;
  public aggregateRootClassProvider: () => AggregateRootConstructor<AggregateRootOf<T>>;

  public constructor(entityClass: EntityConstructor<T>, public readonly moduleMeta: HcAppModuleMeta) {
    super(entityClass);
  }

  public get rootCollectionProperty(): string {
    return this.aggregateRootMeta.collection(this.entityClass).property;
  }

  public get rootIdProperty(): string {
    return this.aggregateRootMeta.entityRootIdProperty;
  }

  public get aggregateRootMeta(): AggregateRootMeta<AggregateRootOf<T>> {
    return this.aggregateRootClass[ENTITY_META_PROPERTY];
  }

  public get aggregateRootClass(): AggregateRootConstructor<AggregateRootOf<T>> {
    if (this._aggregateRootClass === undefined) {
      this._aggregateRootClass = this.aggregateRootClassProvider();
    }
    return this._aggregateRootClass;
  }
}

/**
 * Decorator
 */
export function Entity<T extends AnyEntity>(): (constructor: EntityConstructor<T>) => void {
  return function (constructor) {
    const meta = new EntityMeta(constructor, HcAppModuleMeta.fromError(new Error(), constructor.name));
    constructor[ENTITY_META_PROPERTY] = meta;
  };
}

export class EntityCollectionMeta<T extends AnyEntity> {
  public constructor(public readonly entityClass: EntityConstructor<T>, public readonly property: string) {}
}
export class AggregateRootMeta<T extends AnyAggregateRoot> extends EntityMetaCommon<T> {
  private _collections: Map<string, EntityCollectionMeta<AnyEntity>>;

  public constructor(
    entityClass: AggregateRootConstructor<T>,
    public readonly moduleMeta: HcAppModuleMeta,
    public readonly entityRootIdProperty: string,
  ) {
    super(entityClass);
  }

  public get collections(): Map<string, EntityCollectionMeta<AnyEntity>> {
    if (!this._collections) {
      this._collections = this.entityClass[ENTITY_COLLECTIONS_META_PROPERTY] ?? new Map();
    }

    return this._collections;
  }

  public collection<T extends AnyEntity>(entityClass: EntityConstructor<T>): EntityCollectionMeta<T> {
    return this.collections.get(entityClass.name) as any;
  }
}

export interface AggregateRootDecorateOptions {
  /**
   * Name of property where entities of aggregate root stores aggregate root id.
   * Default: `<aggregateRootClassNameInPascal>Id` e.g. `Author` => `authorId`
   */
  entityRootIdProperty?: string;
}

/**
 * Decorator
 */
export function AggregateRoot<T extends AnyAggregateRoot>(
  options?: AggregateRootDecorateOptions,
): (constructor: AggregateRootConstructor<T>) => void {
  return function (constructor) {
    const entityRootIdProperty = options?.entityRootIdProperty ?? pascalCaseToCamelCase(constructor.name) + 'Id';
    const meta = new AggregateRootMeta(constructor, HcAppModuleMeta.fromError(new Error(), constructor.name), entityRootIdProperty);
    constructor[ENTITY_META_PROPERTY] = meta;
  };
}

export function ENTITY_COMMON_META<T extends AbstractEntityCommon<any>>(entityClass: new (...args: any[]) => T): EntityMetaCommon<T> {
  return entityClass[ENTITY_META_PROPERTY];
}

export function ENTITY_META<T extends AnyEntity>(entityClass: EntityConstructor<T>): EntityMeta<T> {
  return entityClass[ENTITY_META_PROPERTY];
}

export function AGGREGATE_ROOT_META<T extends AnyAggregateRoot>(entityClass: AggregateRootConstructor<T>): AggregateRootMeta<T> {
  return entityClass[ENTITY_META_PROPERTY];
}
