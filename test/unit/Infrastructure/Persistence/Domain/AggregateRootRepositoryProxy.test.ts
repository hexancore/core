import { AggregateRootRepositoryManager, AggregateRootRepositoryProxyHandler } from "@";
import { OKA } from "@hexancore/common";
import { mock, type M } from "@hexancore/mocker";
import { Author, type AuthorRepository } from "@test/src/Test/Domain";

describe('AggregateRootRepositoryProxy', () => {

  test("df", async () => {
    const manager: M<AggregateRootRepositoryManager> = mock();
    const repository: M<AuthorRepository> = mock();
    repository.expects('getAll').andReturn(OKA(10 as any));
    manager.expects("get", Author).andReturn(repository.i);

    const p = AggregateRootRepositoryProxyHandler.create<AuthorRepository>(manager.i, Author) as unknown as AuthorRepository;

    expect(await p.getAll()).toMatchSuccessResult(10);
  });
});