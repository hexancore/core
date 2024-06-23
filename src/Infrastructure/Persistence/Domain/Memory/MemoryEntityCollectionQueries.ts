import { AbstractEntity, EntityCollectionQueriesImpl, EntityCollectionImpl, EntityIdTypeOf } from '../../../../Domain';
import { Result, ERRA, OKA, AR } from '@hexancore/common';
import { MemoryEntityRepository } from './MemoryEntityRepository';

export class MemoryEntityCollectionQueries<T extends AbstractEntity<any, any>, RepositoryType extends MemoryEntityRepository<T>>
  implements EntityCollectionQueriesImpl<T>
{
  public collection!: EntityCollectionImpl<T>;

  public constructor(public r: RepositoryType) {}

  public all(): AsyncGenerator<Result<T>, void, void> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    async function* g() {
      const entities = await that.r.getBy({
        [that.collection.rootIdProperty]: that.collection.root.id,
      });

      if (entities.isError()) {
        yield ERRA<T>(entities.e).p;
        return;
      }

      for (const entity of entities.v) {
        yield OKA(entity);
      }
    }

    return g();
  }

  public getById(id: EntityIdTypeOf<T>): AR<T> {
    return this.r.getById(id, this.collection.rootId);
  }
}
