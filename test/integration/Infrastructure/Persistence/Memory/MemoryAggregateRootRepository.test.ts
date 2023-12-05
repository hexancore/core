/**
 * @group integration
 */

import {
  AbstractAggregateRoot,
  AbstractEntity,
  AggregateRootRepository,
  ENTITY_COLLECTIONS_META_PROPERTY,
  EntityCollection,
  EntityCollectionInterface,
  EntityCollectionQueries,
  EntityRepository,
  ROOT_ID_PROPERTY_META_PROPERTY,
} from '@';
import { AggregateRootRepositoryInterface } from '@/Domain/Repository/AggregateRootRepositoryInterface';
import { MemoryAggregateRootRepository } from '@/Infrastructure/Persistence/Memory/MemoryAggregateRootRepository';
import { MemoryEntityCollectionQueries } from '@/Infrastructure/Persistence/Memory/MemoryEntityCollectionQueries';
import { MemoryEntityRepository } from '@/Infrastructure/Persistence/Memory/MemoryEntityRepository';
import { ValueObject, UIntValue, DefineDomainErrors, standard_entity_errors, DomainErrors, AR, AsyncResult, OK, ERR } from '@hexancore/common';

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

const TestDomainError = DefineDomainErrors(
  'test',
  new (class Test {
    public entity_book: standard_entity_errors = 'not_found';
    public entity_author: standard_entity_errors | 'custom_1' = 'not_found';
    public other_error = '';
  })(),
);

@EntityRepository({
  moduleName: 'Test',
  entityClass: Book,
  rootEntityClass: Author,
  rootCollectionProperty: 'books',
})
class MemoryBookRepository extends MemoryEntityRepository<Book> {
  public getDomainErrors<DE extends DomainErrors<any> = typeof TestDomainError>(): DE {
    return TestDomainError as any;
  }
}

interface AuthorRepository extends AggregateRootRepositoryInterface<Author> {}

@AggregateRootRepository('Test', Author)
class MemoryAuthorRepository extends MemoryAggregateRootRepository<Author> implements AuthorRepository {
  private bookRepository: MemoryBookRepository;

  public constructor() {
    super();
    this.bookRepository = new MemoryBookRepository();
  }

  public persist(entity: Author | Author[]): AR<boolean> {
    return super.persist(entity).onOk(() => {
      return this.bookRepository.persistCollectionFromRoot(entity);
    });
  }

  public getAll(): AR<Iterable<Author>> {
    return super.getAll().map((authors: Author[]) => {
      this.bookRepository.injectCollectionQueries(authors);
      return authors;
    });
  }

  public getDomainErrors<DE extends DomainErrors<any> = typeof TestDomainError>(): DE {
    return TestDomainError as any;
  }
}

describe('MemoryAggregateRootRepository', () => {
  let authorRepository: AuthorRepository;

  beforeEach(() => {
    authorRepository = new MemoryAuthorRepository();
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

    const expected = ERR({
      type: TestDomainError.entity.author.t('not_found'),
      code: 404,
      data: {
        searchCriteria: {
          id,
        },
      },
    });
    expect(current).toEqual(expected);
  });
});
