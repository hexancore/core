
/**
 * @group unit/core
 */
import { Book } from '@test/libs/test-lib/src/Book/Domain/Book/Book';
import { BookCopy } from '@test/libs/test-lib/src/Book/Domain/Book/BookCopy';

import { AGGREGATE_ROOT_META, EntityCollectionMeta } from '../../../../src';

describe('EntityCollection', () => {
  test('meta properties', () => {
    expect(AGGREGATE_ROOT_META(Book).collections).toEqual(new Map([[BookCopy.name, new EntityCollectionMeta(BookCopy, 'copies')]]));
  });

  test('add', () => {
    const book = new Book('test');
    const bookCopy = new BookCopy();

    book.copies.add(bookCopy);

    expect(bookCopy.bookId).toBeUndefined();
    expect(book.copies.waitingAdd).toEqual([bookCopy]);
  });
});
