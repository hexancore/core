/**
 * @group unit/core
 */
import { ValueObject, UIntValue } from '@hexancore/common';
import {
  AbstractAggregateRoot,
  EntityCollection,
  EntityCollectionInterface,
  ENTITY_COLLECTIONS_META_PROPERTY,
  ROOT_ID_PROPERTY_META_PROPERTY,
} from '../../../../src';
import { AbstractEntity } from '../../../../src/Domain/Entity/AbstractEntity';

@ValueObject('Test')
class BookId extends UIntValue {}

class Book extends AbstractEntity<BookId, Author> {
  public readonly authorId?: AuthorId;

  public constructor(public name: string) {
    super();
    return this.proxify();
  }
}

@ValueObject('Test')
class AuthorId extends UIntValue {}

class Author extends AbstractAggregateRoot<AuthorId> {
  @EntityCollection(Book)
  public readonly books: EntityCollectionInterface<Book>;

  public constructor(public name: string) {
    super();
    return this.proxify();
  }
}

describe('EntityCollection', () => {
  test('meta properties', () => {
    expect(Author[ENTITY_COLLECTIONS_META_PROPERTY]).toEqual({
      books: { entityClass: Book },
    });

    expect(Author[ROOT_ID_PROPERTY_META_PROPERTY]).toEqual('authorId');
  });

  test('add when author id undefined', () => {
    const author = new Author('test');

    const book = new Book('test');
    author.books.add(book);

    expect(book.authorId).toBe(author.id);
    expect(author.books.waitingAdd).toEqual([book]);
  });

  test('add when author has id', () => {
    const author = new Author('test');
    author.id = AuthorId.c(1).v;

    const book = new Book('test');
    author.books.add(book);

    expect(author.books.waitingAdd).toEqual([book]);
  });
});
