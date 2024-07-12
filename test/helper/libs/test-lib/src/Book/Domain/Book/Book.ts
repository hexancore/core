import { AggregateRoot, AbstractAggregateRoot } from '@';
import { UIntValue, ValueObject } from '@hexancore/common';

@ValueObject('Test')
export class BookId extends UIntValue<BookId> { }

@AggregateRoot()
export class Book extends AbstractAggregateRoot<BookId> {

  public constructor(public title: string) {
    super();
    return this.proxify();
  }
}
