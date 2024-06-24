import type { IAggregateRootRepository, AnyAggregateRoot, AggregateRootRepositoryManager, ExtractAggregateRootConstructorFromRepository } from "../../../../Domain";

/**
 * Proxy handler to lazy create AggregateRootRepository instance. Used in Providers.
 * @internal
 */
export class AggregateRootRepositoryProxyHandler<R extends IAggregateRootRepository<AnyAggregateRoot>> implements ProxyHandler<R> {
  private repository!: R;

  public constructor(
    private manager: AggregateRootRepositoryManager,
    private entityClass: ExtractAggregateRootConstructorFromRepository<R>
  ) {
  }

  public static create<R extends IAggregateRootRepository<AnyAggregateRoot>>(
    manager: AggregateRootRepositoryManager,
    entityClass: ExtractAggregateRootConstructorFromRepository<R>
  ): R {
    const wrapper = new this<R>(manager, entityClass);
    return new Proxy(wrapper, wrapper);
  }

  public get(_target: any, p: any, _receiver: any): any {
    // skip thenable check in nestjs providers
    if (p === 'then') {
      return undefined;
    }
    
    if (!this.repository) {
      this.repository = this.manager.get<R>(this.entityClass);
      if (p === 'proxyUnwrap') {
        return this.repository;
      }
    }

    return this.repository[p] as any;
  }
}