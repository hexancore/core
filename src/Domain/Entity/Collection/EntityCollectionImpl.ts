import { AR, ARP, ERR, GetQueryOptions, LogicError, OK, Result } from '@hexancore/common';
import {  AggregateRootIdTypeOf, AggregateRootOf, AnyEntity } from '../AbstractEntity';
import { EntityIdTypeOf } from '../AbstractEntityCommon';
import { IEntityCollection } from './IEntityCollection';
import { EntityCollectionQueries } from './EntityCollectionQueries';
import { AggregateRootMeta, ENTITY_META_PROPERTY } from '../EntityDecorator';

export interface EntityCollectionQueriesImpl<T extends AnyEntity> extends EntityCollectionQueries<T> {
  set collection(c: EntityCollectionImpl<T>);
}

export class EntityCollectionImpl<T extends AnyEntity, Q extends EntityCollectionQueriesImpl<T> = EntityCollectionQueriesImpl<T>>
  implements IEntityCollection<T, Q>
{
  private added: T[] = [];
  private updated: T[] = [];
  private removed: T[] = [];
  public q: Q;

  public rootIdProperty: string;

  public constructor(public readonly root: AggregateRootOf<T>) {
    this.rootIdProperty = this.ROOT_ENTITY_META.entityRootIdProperty;
  }

  public get ROOT_ENTITY_META(): AggregateRootMeta<AggregateRootOf<T>> {
    return this.root.constructor[ENTITY_META_PROPERTY];
  }

  public add(entity: T): void {
    if (entity[this.rootIdProperty] !== undefined) {
      throw new LogicError("Can't add entity from other aggregate root");
    }
    this.added.push(entity);
  }

  public update(entity: T): void {
    if (entity.id === undefined) {
      throw new LogicError("Can't update entity without id");
    }

    if (!this.root.id.equals(entity[this.rootIdProperty])) {
      throw new LogicError("Can't update entity from other aggregate root");
    }

    this.updated.push(entity);
  }

  public remove(entity: T): void {
    if (entity.id === undefined) {
      throw new LogicError("can't remove entity without id");
    }

    if (!this.root.id.equals(entity[this.rootIdProperty])) {
      throw new LogicError("can't remove entity from other aggregate root");
    }
    this.removed.push(entity);
  }

  public get waitingAdd(): ReadonlyArray<T> {
    if (this.root.id) {
      this.added.forEach((e) => {
        e[this.rootIdProperty] = this.root.id;
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

  public get rootId(): AggregateRootIdTypeOf<T> {
    return this.root.id;
  }

  public clearWaiting(): void {
    this.added = [];
    this.updated = [];
    this.removed = [];
  }

  public all(options?: GetQueryOptions<T>): AsyncGenerator<Result<T>, void, void> {
    this.checkHasQueries();
    return this.q.all(options);
  }

  public async getAllAsArray(options?: GetQueryOptions<T>): ARP<T[]> {
    this.checkHasQueries();
    const b = [];
    for await (const row of this.q.all(options)) {
      if (row.isError()) {
        return ERR(row.e);
      }

      b.push(row.v);
    }
    return OK(b);
  }

  public getById(id: EntityIdTypeOf<T>): AR<T> {
    this.checkHasQueries();
    return this.q.getById(id);
  }

  public [Symbol.asyncIterator](): AsyncIterator<Result<T>, void, void> {
    return this.all();
  }

  protected checkHasQueries(): void {
    if (this.q === undefined) {
      throw new LogicError('Collection queries not set');
    }
  }

  public isTracked(): boolean {
    return this.root.__tracked;
  }

  /**
   * Used only in infra layer.
   */
  public set __queries(q: Q) {
    this.q = q;
    q.collection = this as any;
  }
}
