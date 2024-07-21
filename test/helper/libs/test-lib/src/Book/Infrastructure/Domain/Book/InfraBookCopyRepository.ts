import { EntityRepository, MEMORY_PERSISTER_TYPE, MemoryEntityRepository } from "@";
import { BookCopy } from "../../../Domain/Book/BookCopy";

@EntityRepository(BookCopy, MEMORY_PERSISTER_TYPE)
export class InfraBookCopyRepository extends MemoryEntityRepository<BookCopy> { }