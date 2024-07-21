import { AggregateRoot, AbstractAggregateRoot, EntityCollection, type IEntityCollection } from '@';
import type { BookId } from './Shared/BookId';
import { BookCopy } from './BookCopy';

@AggregateRoot()
export class Book extends AbstractAggregateRoot<BookId> {

  @EntityCollection(BookCopy)
  public declare readonly copies: IEntityCollection<BookCopy>;

  public constructor(public title: string) {
    super();
    return this.proxify();
  }
}
