import {
  CurrentTime,
  LogicError,
  AR,
  INTERNAL_ERROR,
  ERRA,
  DomainErrors,
  OK,
  wrapToArray,
  EnumEntityErrorTypeWrapper,
  DateTime,
} from '@hexancore/common';
import { AbstractEntityCommon, EntityIdTypeOf } from '../Entity/AbstractEntityCommon';

export const ENTITY_REPOSITORY_META_PROPERTY = '__HC_ENTITY_REPOSITORY_META';

export interface CommonEntityRepositoryMeta {
  module: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  entityClass: Function;
  entityName: string;
  entityNameSnake: string;
}

export class EntityPropertiesNowInjector<T extends AbstractEntityCommon<any>,> {
  public constructor(private properties: string[]) {
  }

  public inject(now: DateTime, entity: T):void {
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

export abstract class AbstractEntityPersister<T extends AbstractEntityCommon<any>, EID extends EntityIdTypeOf<T> = EntityIdTypeOf<T>> {
  public ct: CurrentTime;
  protected nowInjector: EntityPropertiesNowInjector<T> | undefined | false;

  public constructor(protected META: CommonEntityRepositoryMeta, protected domainErrors: DomainErrors<any>) {
    this.ct = CurrentTime.i;
  }

  public persist(entity: T | T[]): AR<boolean> {
    const entities = wrapToArray(entity);
    this.injectNow(entities);
    return this.doPersist(entities).onOk(() => {
      this.markAsTracked(entities);
      return OK(true);
    });
  }

  protected abstract doPersist(entities: T[]): AR<boolean>;

  public injectNow(entities: T[]): void {
    this.initNowInjector();

    if (this.nowInjector) {
      const now = this.ct.now;
      this.nowInjector.injectMany(now, entities);
    }
  }

  protected initNowInjector(): void {
    if (this.nowInjector === undefined) {
      const props = this.loadPropertiesToFillWithNow();
      if (props.length === 0) {
        this.nowInjector = false;
      }
      this.nowInjector = new EntityPropertiesNowInjector(props);
    }
  }

  protected loadPropertiesToFillWithNow(): string[] {
    return [];
  }

  public markAsTracked(entities: T[]): void {
    AbstractEntityCommon.markAsTracked(entities);
  }

  public abstract delete(entity: T | T[]): AR<number>;

  public abstract getById(id: EID): AR<T>;

  public abstract getAll(): AR<Iterable<T>>;

  public getAllAsArray(): AR<T[]> {
    return this.getAll().map((entities: Iterable<T>) => Array.from(entities));
  }

  protected DUPLICATE<T>(data?: any): AR<T> {
    return this.ENTITY_ERRA('duplicate', data);
  }

  protected NOT_FOUND<T>(searchCriteria: Record<string, any>): AR<T> {
    return this.ENTITY_ERRA<T>('not_found', { searchCriteria });
  }

  private ENTITY_ERRA<T>(type: string, data?: any): AR<T> {
    const entity = this.META.entityNameSnake;
    const entityErrors: EnumEntityErrorTypeWrapper<any> = this.domainErrors.entity[entity];
    if (!entityErrors) {
      return ERRA(INTERNAL_ERROR(new LogicError('Undefined entity domain errors: ' + entity)));
    }

    return entityErrors.erra(type, data);
  }
}
