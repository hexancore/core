/**
 * @group integration
 */

import { HcInfraMemoryDomainModule, HcModule, InjectAggregateRootRepository } from '@';
import { OK } from '@hexancore/common';
import { Injectable } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Author, AuthorId, Book, BookId, type AuthorRepository } from '@test/src/Test/Domain';
import { TestDomainErrors } from '@test/src/Test/Domain/TestDomainErrors';
import { PrivateTestInfraModule } from '@test/src/Test/Infrastructure/PrivateTestInfraModule';

@Injectable()
class AuthorService {
  public constructor(@InjectAggregateRootRepository(Author) public repository: AuthorRepository) { }
}

describe('MemoryAggregateRootRepository', () => {
  let module: TestingModule;
  let authorRepository: AuthorRepository;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        HcModule.forRoot(),
        HcInfraMemoryDomainModule,
        PrivateTestInfraModule,

      ],
      providers: [AuthorService]
    }).compile();

    authorRepository = module.get(AuthorService).repository;
  });

  afterEach(async () => {
    if (module) {
      module.close();
    }
  });

  test('persist()', async () => {
    const author = new Author('test_author');
    author.id = AuthorId.cs(1);

    const book = new Book('test_book');
    book.id = BookId.cs(1);
    author.books.add(book);

    const rp = await authorRepository.persist(author);
    expect(rp).toEqual(OK(true));

    const r = await authorRepository.getAllAsArray();
    expect(r.isSuccess()).toBeTruthy();

    expect(r.v[0].id).toEqual(author.id);

    const abr = await r.v[0].books.getAllAsArray();
    expect(abr.isSuccess()).toBeTruthy();
    const ab = abr.v;
    expect(ab.length).toBe(1);
    expect(ab[0]).toEqual(book);

    const currentBookById = await r.v[0].books.getById(ab[0].id);

    expect(currentBookById).toEqual(OK(book));
  });

  test('getById() when not exists', async () => {
    const id = AuthorId.cs(1);
    const current = await authorRepository.getById(id);

    expect(current).toMatchAppError({
      type: TestDomainErrors.entity.author.t('not_found'),
      code: 404,
      data: {
        searchCriteria: {
          id,
        },
      },
    });
  });
});
