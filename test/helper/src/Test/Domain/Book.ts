import { Entity, AbstractEntity } from '@';
import { UIntValue, ValueObject } from '@hexancore/common';
import { Author, AuthorId } from './Author';

@ValueObject('Test')
export class BookId extends UIntValue<BookId> { }

@Entity()
export class Book extends AbstractEntity<BookId, Author> {

  public readonly authorId?: AuthorId;

  public constructor(public name: string) {
    super();
    return this.proxify();
  }
}
