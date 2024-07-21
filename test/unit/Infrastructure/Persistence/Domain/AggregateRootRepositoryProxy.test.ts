import { AggregateRootRepositoryManager, AggregateRootRepositoryProxyHandler } from "@";
import { OKA } from "@hexancore/common";
import { mock, type M } from "@hexancore/mocker";
import { Book } from "@test/libs/test-lib/src/Book/Domain/Book/Book";
import type { BookRepository } from "@test/libs/test-lib/src/Book/Domain/Book/BookRepository";

describe('AggregateRootRepositoryProxy', () => {

  test("create", async () => {
    const manager: M<AggregateRootRepositoryManager> = mock();
    const repository: M<BookRepository> = mock();
    repository.expects('getAll').andReturn(OKA(10 as any));
    manager.expects("get", Book).andReturn(repository.i);

    const p = AggregateRootRepositoryProxyHandler.create<BookRepository>(manager.i, Book) as unknown as BookRepository;

    expect(await p.getAll()).toMatchSuccessResult(10);
  });
});