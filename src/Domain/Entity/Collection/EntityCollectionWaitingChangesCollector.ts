import { AbstractEntity } from '../AbstractEntity';
import { EntityIdTypeOf } from '../AbstractEntityCommon';
import { EntityCollectionInterface } from './EntityCollectionInterface';
import { EntityCollectionQueries } from './EntityCollectionQueries';

/**
 * Helper used in persistance layer for get chanages in entity collection to persist in database
 */
export class EntityCollectionWaitingChangesCollector<T extends AbstractEntity<any, any>> {
  public waitingAdd: T[] = [];
  public waitingUpdate: T[] = [];
  public waitingRemove: T[] = [];

  public static collectFrom<
    T extends AbstractEntity<any, any>,
    EID = EntityIdTypeOf<T>,
    ECQ extends EntityCollectionQueries<T, EID> = EntityCollectionQueries<T>,
  >(
    collection: EntityCollectionInterface<T, EID, ECQ> | ReadonlyArray<EntityCollectionInterface<T, EID, ECQ>>,
  ): EntityCollectionWaitingChangesCollector<T> {
    const collector = new this<T>();
    if (Array.isArray(collection)) {
      collection.reduce((collector: EntityCollectionWaitingChangesCollector<T>, c: EntityCollectionInterface<T, EID, ECQ>) => {
        collector.waitingAdd.push(...c.waitingAdd);
        collector.waitingUpdate.push(...c.waitingUpdate);
        collector.waitingRemove.push(...c.waitingRemove);
        c.clearWaiting();
        return collector;
      }, collector);
    } else {
      const c = collection as EntityCollectionInterface<T, EID, ECQ>;

      collector.waitingAdd.push(...c.waitingAdd);
      collector.waitingUpdate.push(...c.waitingUpdate);
      collector.waitingRemove.push(...c.waitingRemove);
      c.clearWaiting();
    }

    return collector;
  }
}
