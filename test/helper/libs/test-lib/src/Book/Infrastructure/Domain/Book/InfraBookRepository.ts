import { AggregateRootRepository, MEMORY_PERSISTER_TYPE, MemoryAggregateRootRepository } from "@";
import { Book } from "@test/libs/test-lib/src/Book/Domain/Book/Book";
import type { BookRepository } from "../../../Domain/Book/BookRepository";

@AggregateRootRepository(Book, MEMORY_PERSISTER_TYPE)
export class InfraBookRepository extends MemoryAggregateRootRepository<Book> implements BookRepository { }