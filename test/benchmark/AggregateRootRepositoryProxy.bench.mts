import type { AggregateRootRepositoryManager } from '@/Domain/index.js';
import { AggregateRootRepositoryProxyHandler } from '@/Infrastructure/Persistence/Domain/Generic/AggregateRootRepositoryProxy.js';
import { OKA } from '@hexancore/common';
import { Author } from '@test/src/Test/Domain/Author/Author.js';
import type { AuthorRepository } from '@test/src/Test/Domain/Author/AuthorRepository.js';
import { run, bench, group, baseline } from 'mitata';

const repository = {
  getAll() {
    return OKA([10, 20, 30]);
  }
};

const manager: AggregateRootRepositoryManager = {
  get(entityClass) {
    if (entityClass !== Author) {
      throw new Error("Invalid entityClass");
    }

    return repository;
  }
} as any;

const proxy = AggregateRootRepositoryProxyHandler.create<AuthorRepository>(manager, Author);

group('Direct vs Proxy', () => {
  baseline('Direct', async () => repository.getAll());
  bench('Proxy', async () => proxy.getAll());
});

await run({
  silent: false,
  avg: true,
  json: false,
  colors: true,
  min_max: true,
  percentiles: true,
});
