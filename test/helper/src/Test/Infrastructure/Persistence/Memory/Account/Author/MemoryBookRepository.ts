import { EntityRepository, MemoryEntityRepository } from "@";
import { Book } from "@test/src/Test/Domain";

@EntityRepository(Book, 'memory')
export class MemoryBookRepository extends MemoryEntityRepository<Book> { }