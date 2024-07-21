import { AbstractEntityCommon, EntityMetaCommon, EntityIdTypeOf } from '@/Domain';
import { AR, AbstractValueObject, AsyncResult, CurrentTime, OK, OKA, wrapToArray } from '@hexancore/common';
import { AbstractEntityPersister, AbstractEntityRepositoryCommon } from '../Generic';

export const MEMORY_PERSISTER_TYPE = "memory";

export class MemoryEntityPersister<T extends AbstractEntityCommon<any>, M extends EntityMetaCommon<T>> extends AbstractEntityPersister<T, M> {
  protected persisted: T[];

  public constructor(repository: AbstractEntityRepositoryCommon<any, any, any>, ct?: CurrentTime) {
    super(repository, ct);
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

    const left: T[] = [];
    let deleteCount = 0;

    entity.forEach((e) => {
      const index = this.persisted.findIndex((v) => v.id.equals(e.id));
      if (index !== -1) {
        this.persisted.splice(index);
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

  public getOneBy(criteria: Record<string, any>): AR<T> {
    return this.getBy(criteria).onOk((found) => {
      if (found.length === 0) {
        return this.NOT_FOUND<never>(criteria);
      }

      return OK(found[0]);
    });
  }

  public getById(id: EntityIdTypeOf<T>): AR<T> {
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
        } else if (e[prop] !== criteria[prop]) {
          return false;
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
