import { AR, ARP, ERR, OK, Result } from '@hexancore/common';
import { AbstractAggregateRoot } from '../AbstractAggregateRoot';
import { AbstractEntity } from '../AbstractEntity';
import { EntityIdTypeOf } from '../AbstractEntityCommon';
import { EntityCollectionInterface } from './EntityCollectionInterface';
import { EntityCollectionQueries } from './EntityCollectionQueries';

export interface EntityCollectionQueriesImpl<T extends AbstractEntity<any, any>, EID = EntityIdTypeOf<T>> extends EntityCollectionQueries<T, EID> {
  set collection(c: EntityCollectionImpl<T, EID, EntityCollectionQueriesImpl<T, EID>>);
}

export class EntityCollectionImpl<
  T extends AbstractEntity<any, any>,
  EID = EntityIdTypeOf<T>,
  ECQ extends EntityCollectionQueriesImpl<T, EID> = EntityCollectionQueriesImpl<T, EID>,
> implements EntityCollectionInterface<T, EID, ECQ>
{
  private added: T[] = [];
  private updated: T[] = [];
  private removed: T[] = [];
  public q: ECQ;

  public constructor(public readonly root: AbstractAggregateRoot<any>, public readonly rootIdPropertyName: string) {}

  public add(entity: T): void {
    if (entity[this.rootIdPropertyName] !== undefined) {
      throw new Error("Logic error: can't add entity from other aggregate root");
    }
    this.added.push(entity);
  }

  public update(entity: T): void {
    if (entity.id === undefined) {
      throw new Error("Logic error: can't update entity without id");
    }

    if (!this.root.id.equals(entity[this.rootIdPropertyName])) {
      throw new Error("Logic error: can't update entity from other aggregate root");
    }

    this.updated.push(entity);
  }

  public remove(entity: T): void {
    if (entity.id === undefined) {
      throw new Error("Logic error: can't remove entity without id");
    }

    if (!this.root.id.equals(entity[this.rootIdPropertyName])) {
      throw new Error("Logic error: can't remove entity from other aggregate root");
    }
    this.removed.push(entity);
  }

  public get waitingAdd(): ReadonlyArray<T> {
    if (this.root.id) {
      this.added.forEach((e) => {
        e[this.rootIdPropertyName] = this.root.id;
      });
    }
    return this.added;
  }

  public get waitingUpdate(): ReadonlyArray<T> {
    return this.updated;
  }

  public get waitingRemove(): ReadonlyArray<T> {
    return this.removed;
  }

  public clearWaiting(): void {
    this.added = [];
    this.updated = [];
    this.removed = [];
  }

  public all(): AsyncGenerator<Result<T>, void, void> {
    return this.q.all();
  }

  public async getAllAsArray(): ARP<T[]> {
    const b = [];
    for await (const row of this.q.all()) {
      if (row.isError()) {
        return ERR(row.e);
      }

      b.push(row.v);
    }
    return OK(b);
  }

  public getById(id: EID): AR<T> {
    return this.q.getById(id);
  }

  public [Symbol.asyncIterator](): AsyncIterator<Result<T>, void, void> {
    return this.q.all();
  }

  /**
   * Used only in infra layer.
   */
  public set __queries(q: ECQ) {
    this.q = q;
    q.collection = this;
  }
}
