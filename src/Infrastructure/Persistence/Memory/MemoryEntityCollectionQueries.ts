import {
  AbstractEntityRepository,
  AbstractEntity,
  EntityCollectionQueriesImpl,
  EntityCollectionImpl,
  EntityIdTypeOf,
  AggregateRootOf,
  AbstractAggregateRoot,
} from '../../../Domain';
import { Result, P, ERRA, OKA, AR } from '@hexancore/common';
import { MemoryEntityRepository } from './MemoryEntityRepository';

export interface MemoryEntityCollectionQueriesOptions<R extends MemoryEntityRepository<any>> {
  r: R;
}

export class MemoryEntityCollectionQueries<
  T extends AbstractEntity<any, any>,
  RepositoryType extends MemoryEntityRepository<T>,
  EID extends EntityIdTypeOf<T> = EntityIdTypeOf<T>,
  R extends AbstractAggregateRoot<any> = AggregateRootOf<T>,
> implements EntityCollectionQueriesImpl<T, EID>
{
  public collection: EntityCollectionImpl<T, EID>;

  public constructor(public r: RepositoryType) {}

  public all(): AsyncGenerator<Result<T>, void, void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    async function* g() {
      const entities = await that.r.getBy({
        [that.collection.rootIdPropertyName]: that.collection.root.id,
      });

      if (entities.isError()) {
        yield ERRA<T>(entities.e).promise;
      }

      for (const entity of entities.v) {
        yield OKA(entity);
      }

      return;
    }

    return g();
  }

  public getById(id: EID): AR<T> {
    return this.r.getById(id);
  }
}
