import { AbstractEntity, Entity } from '@';
import type { Book } from './Book';
import type { BookCopyId } from './Shared/ValueObject/BookCopyId';

@Entity()
export class BookCopy extends AbstractEntity<BookCopyId, Book> {

  public readonly bookId?: BookCopy;

  public constructor() {
    super();
    return this.proxify();
  }
}
