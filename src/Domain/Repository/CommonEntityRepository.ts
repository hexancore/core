import { AR, AbstractValueObject, DomainErrors } from '@hexancore/common';
import { AbstractEntity } from '../Entity/AbstractEntity';
import { EntityIdTypeOf } from '../Entity/AbstractEntityCommon';
import { AbstractEntityPersister } from './AbstractEntityRepositoryPersister';

/**
 * Entity Repository base class
 */
export abstract class CommonEntityRepository<
  T extends AbstractEntity<any, any>,
  P extends AbstractEntityPersister<T, EID>,
  EID extends EntityIdTypeOf<T> = EntityIdTypeOf<T>,
> {
  protected persister: P;

  public constructor() {}

  public persist(entity: T | T[]): AR<boolean> {
    return this.persister.persist(entity);
  }

  public getById(id: EID): AR<T> {
    return this.persister.getById(id);
  }

  public getAll(): AR<Iterable<T>> {
    return this.persister.getAll();
  }

  public getAllAsArray(): AR<T[]> {
    return this.getAll().map((entities: Iterable<T>) => Array.from(entities));
  }

  public abstract getDomainErrors<DE extends DomainErrors<any>>(): DE;
}
