import { AggregateRootRepository, MemoryAggregateRootRepository } from "@";
import { Book } from "@test/libs/test-lib/src/Book/Domain/Book/Book";

@AggregateRootRepository(Book, 'memory')
export class MemoryBookRepository extends MemoryAggregateRootRepository<Book> { }