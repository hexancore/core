/**
 * @group integration
 */

import { HcMemoryDomainInfraModule, HcModule, InjectAggregateRootRepository } from '@';
import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BookCopyId, BookDomainErrors, BookId } from '@test/libs/test-lib/src';
import { Book } from '@test/libs/test-lib/src/Book/Domain/Book/Book';
import { BookCopy } from '@test/libs/test-lib/src/Book/Domain/Book/BookCopy';
import type { BookRepository } from '@test/libs/test-lib/src/Book/Domain/Book/BookRepository';
import { BookDomainInfraModule } from '@test/libs/test-lib/src/Book/Infrastructure/Domain/BookDomainInfraModule';

@Injectable()
class Book2Service {
  public constructor(@InjectAggregateRootRepository(Book) public repository: BookRepository) { }
}

describe('MemoryAggregateRootRepository', () => {
  let module: TestingModule;
  let bookRepository: BookRepository;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        HcModule.forRoot(),
        HcMemoryDomainInfraModule,
        BookDomainInfraModule
      ],
      providers: [Book2Service]
    }).compile();

    bookRepository = module.get(Book2Service).repository;
  });

  afterEach(async () => {
    if (module) {
      module.close();
    }
  });

  test('persist()', async () => {
    const book = new Book('test_author');
    book.id = BookId.cs(1);

    const bookCopy = new BookCopy();
    bookCopy.id = BookCopyId.cs(1);
    book.copies.add(bookCopy);

    const rp = await bookRepository.persist(book);
    expect(rp).toMatchSuccessResult(true);

    const r = await bookRepository.getAllAsArray();
    expect(r.isSuccess()).toBeTruthy();

    expect(r.v[0].id).toEqual(book.id);

    const abr = await r.v[0].copies.getAllAsArray();
    expect(abr.isSuccess()).toBeTruthy();
    const ab = abr.v;
    expect(ab.length).toBe(1);
    expect(ab[0]).toEqual(bookCopy);

    const currentBookById = await r.v[0].copies.getById(ab[0].id);
    expect(currentBookById).toMatchSuccessResult(bookCopy);
  });

  test('getById() when not exists', async () => {
    const id = BookId.cs(1);
    const current = await bookRepository.getById(id);

    expect(current).toMatchAppError({
      type: BookDomainErrors.entity.book.t('not_found'),
      code: 404,
      data: {
        searchCriteria: {
          id,
        },
      },
    });
  });
});
