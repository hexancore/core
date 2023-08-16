import { AbstractEntityCommon, AbstractEntityPersister, CommonEntityRepositoryMeta, EntityIdTypeOf } from '@/Domain';
import { AR, AbstractValueObject, AsyncResult, DomainErrors, OK, OKA, wrapToArray } from '@hexancore/common';

export class MemoryEntityRepositoryPersister<
  T extends AbstractEntityCommon<any>,
  EID extends EntityIdTypeOf<T> = EntityIdTypeOf<T>,
> extends AbstractEntityPersister<T> {
  protected persisted: T[];

  public constructor(META: CommonEntityRepositoryMeta, domainErrors: DomainErrors<any>) {
    super(META, domainErrors);
    this.persisted = [];
  }

  public persist(entity: T | T[]): AR<boolean> {
    const entities = Array.isArray(entity) ? entity : [entity];
    this.injectNow(entities);

    entities.forEach((e) => {
      if (this.persisted.findIndex((v) => v.id.equals(e.id)) !== -1) {
        return this.DUPLICATE({ id: e.id });
      }

      this.persisted.push(e);
    });

    this.markAsTracked(entities);

    return OKA(true);
  }

  protected doPersist(entities: T[]): AR<boolean> {
    entities.forEach((e) => {
      if (this.persisted.findIndex((v) => v.id.equals(e.id)) !== -1) {
        return this.DUPLICATE({ id: e.id });
      }

      this.persisted.push(e);
    });

    return OKA(true);
  }

  public delete(entity: T | T[]): AR<number> {
    entity = wrapToArray(entity);

    const left = [];
    let deleteCount = 0;

    entity.forEach((e) => {
      const index = this.persisted.findIndex((v) => v.id.equals(e.id));
      if (index !== -1) {
        delete this.persisted[index];
        deleteCount++;
      }
    });

    this.persisted.forEach((e) => {
      if (e) {
        left.push(e);
      }
    });

    this.persisted = left;

    return OKA(deleteCount);
  }

  public getById(id: EID): AsyncResult<T> {
    const result = this.persisted.filter((e) => e.id.equals(id));
    if (result.length === 0) {
      return this.NOT_FOUND({ id });
    }

    return OKA(result[0]);
  }

  public getBy(criteria: Record<string, any>): AR<T[]> {
    const result = this.persisted.filter((e) => {
      for (const prop in criteria) {
        if (criteria[prop] instanceof AbstractValueObject) {
          if (!criteria[prop].equals(e[prop])) {
            return false;
          }
        } else {
          if (e[prop] !== criteria[prop]) {
            return false;
          }
        }
      }

      return true;
    });

    return OKA(result);
  }

  public getAll(): AsyncResult<Iterable<T>> {
    return OKA(this.persisted);
  }
}
