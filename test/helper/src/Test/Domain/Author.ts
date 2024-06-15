import { AbstractAggregateRoot, AggregateRoot, EntityCollection, IEntityCollection } from '@';
import { UIntValue, ValueObject } from '@hexancore/common';
import { Book } from './Book';

@ValueObject('Test')
export class AuthorId extends UIntValue<AuthorId> { }

@AggregateRoot()
export class Author extends AbstractAggregateRoot<AuthorId> {
  @EntityCollection(Book)
  public declare readonly books: IEntityCollection<Book>;

  public constructor(public name: string) {
    super();
    return this.proxify();
  }
}
