import {
  CurrentTime,
  LogicError,
  AR,
  INTERNAL_ERROR,
  ERRA,
  DomainErrors,
  OK,
  EnumEntityErrorTypeWrapper,
  DateTime,
  OKA,
  isIterable,
} from '@hexancore/common';
import { AbstractEntityCommon } from '../../../../../Domain/Entity/AbstractEntityCommon';
import { AbstractEntityRepositoryCommon, DOMAIN_ERRORS_PROPERTY } from '../AbstractEntityRepositoryCommon';
import { AnyAggregateRoot, AnyEntity, EntityMetaCommon, ENTITY_META_PROPERTY } from '../../../../../Domain/Entity';

export type OneOrIterable<T> = T | Iterable<T>;
export type OrderDirection = 'ASC' | 'DESC';

export interface GetQueryOptions<T> {
  orderBy?: Record<keyof T, OrderDirection>;
  limit?: number;
  offset?: number;
}

export class EntityPropertiesNowInjector<T extends AbstractEntityCommon<any>> {
  public constructor(private properties: string[]) {}

  public inject(now: DateTime, entity: T): void {
    this.properties.forEach((propertyName: string) => {
      entity[propertyName] = entity[propertyName] ?? now;
    });
  }

  public injectMany(now: DateTime, entities: T[]): void {
    this.properties.forEach((propertyName: string) => {
      entities.forEach((e) => {
        e[propertyName] = e[propertyName] ?? now;
      });
    });
  }
}

export abstract class AbstractEntityPersister<T extends AnyEntity | AnyAggregateRoot, M extends EntityMetaCommon<T>> {
  public ct: CurrentTime;
  protected nowInjector: EntityPropertiesNowInjector<T> | undefined | false;

  protected entityMeta: M;
  protected errors: DomainErrors<any>;

  public constructor(repository: AbstractEntityRepositoryCommon<T, any, any>, ct?: CurrentTime) {
    this.entityMeta = repository.constructor[ENTITY_META_PROPERTY];
    this.errors = repository.constructor[DOMAIN_ERRORS_PROPERTY];
    this.ct = ct ?? CurrentTime.i;
  }

  public persist(entity: OneOrIterable<T>): AR<boolean> {
    const entities = isIterable(entity) ? entity : ([entity] as any);
    return this.injectNow(entities).onOk(() =>
      this.doPersist(entities).onOk(() => {
        this.markAsTracked(entities);
        return OK(true);
      }),
    );
  }

  protected abstract doPersist(entities: T[]): AR<boolean>;

  public injectNow(entities: T[]): AR<boolean> {
    return this.initNowInjector().onOk(() => {
      if (this.nowInjector) {
        const now = this.ct.now;
        this.nowInjector.injectMany(now, entities);
      }
      return OK(true);
    });
  }

  protected initNowInjector(): AR<boolean> {
    if (this.nowInjector === undefined) {
      return this.loadPropertiesToFillWithNow().onOk((props) => {
        if (props.length === 0) {
          this.nowInjector = false;
        }
        this.nowInjector = new EntityPropertiesNowInjector(props);
        return OK(true);
      });
    }

    return OKA(true);
  }

  protected loadPropertiesToFillWithNow(): AR<string[]> {
    return OKA([]);
  }

  public markAsTracked(entities: T[]): void {
    AbstractEntityCommon.markAsTracked(entities);
  }

  public abstract delete(entity: T | T[]): AR<number>;

  /**
   * Returns all entities from store as iterable
   */
  public abstract getAll(options?: GetQueryOptions<T>): AR<Iterable<T>>;

  /**
   * Returns all entities from store as array
   * @returns
   */
  public getAllAsArray(options?: GetQueryOptions<T>): AR<T[]> {
    return this.getAll(options).onOk((entities: Iterable<T>) => Array.from(entities));
  }

  public DUPLICATE<T>(data?: any): AR<T> {
    return this.ENTITY_ERRA('duplicate', data);
  }

  public NOT_FOUND<T>(searchCriteria: Record<string, any>): AR<T> {
    return this.ENTITY_ERRA<T>('not_found', { searchCriteria });
  }

  public ENTITY_ERRA<T>(type: string, data?: any): AR<T> {
    const entity = this.entityMeta.nameSnake;
    const entityErrors: EnumEntityErrorTypeWrapper<any> = this.errors.entity[entity];
    if (!entityErrors) {
      return ERRA(INTERNAL_ERROR(new LogicError('Undefined entity domain errors: ' + entity)));
    }

    return entityErrors.erra(type, data);
  }
}
