import { AR, R } from '@hexancore/common';
import { AbstractEntity } from '../AbstractEntity';
import { EntityIdTypeOf } from '../AbstractEntityCommon';
import { GetQueryOptions } from '@/Infrastructure/Persistence/Domain/Generic';

/**
 * Inteface to implement custom queries on entity collection
 */
export interface EntityCollectionQueries<T extends AbstractEntity<any, any>> {
  all(options?: GetQueryOptions<T>): AsyncGenerator<R<T>, void, void>;
  getById(id: EntityIdTypeOf<T>): AR<T>;
}
