/**
 * @group integration
 */

import { AggregateRootRepository, AggregateRootRepositoryManager, EntityRepository, HcModule, HcInfraMemoryDomainModule } from '@';
import { IAggregateRootRepository } from '@/Domain/Repository/IAggregateRootRepository';
import { HcInfraDomainModule } from '@/Infrastructure/Persistence/Domain/Generic/HcInfraDomainModule';
import { MemoryAggregateRootRepository } from '@/Infrastructure/Persistence/Domain/Memory/MemoryAggregateRootRepository';
import { MemoryEntityRepository } from '@/Infrastructure/Persistence/Domain/Memory/MemoryEntityRepository';
import { OK } from '@hexancore/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TEST_MODULE_DIR } from '@test/Module/Test';
import { Author, AuthorId } from '@test/Module/Test/Domain/Author';
import { Book, BookId } from '@test/Module/Test/Domain/Book';
import { TestDomainErrors } from '@test/Module/Test/Domain/TestDomainErrors';

@EntityRepository(Book, 'memory')
export class MemoryBookRepository extends MemoryEntityRepository<Book> {}

interface AuthorRepository extends IAggregateRootRepository<Author> {}

@AggregateRootRepository(Author, 'memory')
export class MemoryAuthorRepository extends MemoryAggregateRootRepository<Author> implements AuthorRepository {}

describe('MemoryAggregateRootRepository', () => {
  let module: TestingModule;
  let authorRepository: AuthorRepository;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        HcModule,
        HcInfraMemoryDomainModule,
        HcInfraDomainModule.forFeature({
          moduleInfraFilePath: TEST_MODULE_DIR,
        }),
      ],
    }).compile();

    authorRepository = module.get(AggregateRootRepositoryManager).get(Author);
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
