/**
 * @group unit/core
 */
import { Author, AuthorId } from '@test/Module/Test/Domain/Author';
import { Book } from '@test/Module/Test/Domain/Book';
import { AGGREGATE_ROOT_META, EntityCollectionMeta } from '../../../../src';

describe('EntityCollection', () => {
  test('meta properties', () => {
    expect(AGGREGATE_ROOT_META(Author).collections).toEqual(new Map([[Book.name, new EntityCollectionMeta(Book, 'books')]]));
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
