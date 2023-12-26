import { AnyEntity } from '../AbstractEntity';
import { IEntityCollection } from './IEntityCollection';

/**
 * Helper used in persistance layer for get chanages in entity collection to persist in database
 */
export class EntityCollectionWaitingChangesCollector<T extends AnyEntity> {
  public waitingAdd: T[] = [];
  public waitingUpdate: T[] = [];
  public waitingRemove: T[] = [];

  public static collectFrom<T extends AnyEntity>(
    collection: IEntityCollection<T> | ReadonlyArray<IEntityCollection<T>>,
  ): EntityCollectionWaitingChangesCollector<T> {
    const collector = new this<T>();
    if (Array.isArray(collection)) {
      collection.reduce((collector: EntityCollectionWaitingChangesCollector<T>, c: IEntityCollection<T>) => {
        collector.waitingAdd.push(...c.waitingAdd);
        collector.waitingUpdate.push(...c.waitingUpdate);
        collector.waitingRemove.push(...c.waitingRemove);
        c.clearWaiting();
        return collector;
      }, collector);
    } else {
      const c = collection as IEntityCollection<T>;

      collector.waitingAdd.push(...c.waitingAdd);
      collector.waitingUpdate.push(...c.waitingUpdate);
      collector.waitingRemove.push(...c.waitingRemove);
      c.clearWaiting();
    }

    return collector;
  }
}
