import { AR, Result } from '@hexancore/common';
import { AbstractEntity } from '../AbstractEntity';
import { EntityIdTypeOf } from '../AbstractEntityCommon';

/**
 * Inteface to implement custom queries on entity collection
 */
export interface EntityCollectionQueries<T extends AbstractEntity<any, any>, EID = EntityIdTypeOf<T>> {
  all(): AsyncGenerator<Result<T>, void, void>;
  getById(id: EID): AR<T>;
}
