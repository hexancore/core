import { AggregateRootRepository, MemoryAggregateRootRepository } from "@";
import { Author } from "@test/src/Test/Domain";
import type { AuthorRepository } from "@test/src/Test/Domain/Author/AuthorRepository";

@AggregateRootRepository(Author, 'memory')
export class MemoryAuthorRepository extends MemoryAggregateRootRepository<Author> implements AuthorRepository { }