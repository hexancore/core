import type { DomainErrors } from "@hexancore/common";
import { AggregateRootRepositoryManager, getAggregateRootRepositoryToken, type AggregateRootConstructor } from "../../../../Domain";
import type { ModuleMetadata, Provider } from "@nestjs/common";
import { InfraAggregateRootRepositoryManager } from "./Manager/InfraAggregateRootRepositoryManager";
import { EntityPersisterFactoryManager } from "./Persister";
import { AggregateRootRepositoryProxyHandler } from "./AggregateRootRepositoryProxyHandler";

const AGGREGATE_ROOT_REPOSITORY_PROVIDER_INJECT = [AggregateRootRepositoryManager];
class AggregateRootRepositoryProvider {
  public provide: string;
  public inject: any[];
  public useFactory: (manager: AggregateRootRepositoryManager) => AggregateRootRepositoryProxyHandler<any>;

  public constructor(root: AggregateRootConstructor) {
    this.provide = getAggregateRootRepositoryToken(root);
    this.inject = AGGREGATE_ROOT_REPOSITORY_PROVIDER_INJECT;
    this.useFactory = (manager: AggregateRootRepositoryManager) => {
      return AggregateRootRepositoryProxyHandler.create<any>(manager, root);
    };
  }
}

export class DomainInfraModuleHelper {
  public static createMeta(options: {
    featureName: string,
    domainErrors: DomainErrors<any>,
    aggregateRootCtrs: AggregateRootConstructor[];
  }): Required<Pick<ModuleMetadata, "providers" | "exports">> {
    const aggregateRootRepositoryProviders: Provider[] = options.aggregateRootCtrs.map(
      r => new AggregateRootRepositoryProvider(r)
    );

    return {
      providers: [
        AggregateRootRepositoryManager,
        this.createInfraAggregateRootRepositoryManagerProvider(options.featureName, options.domainErrors),
        ...aggregateRootRepositoryProviders
      ],
      exports: [
        AggregateRootRepositoryManager,
        ...aggregateRootRepositoryProviders
      ]
    };
  }

  private static createInfraAggregateRootRepositoryManagerProvider(featureName: string, domainErrors: DomainErrors<any>): Provider {
    return {
      provide: InfraAggregateRootRepositoryManager,
      inject: [EntityPersisterFactoryManager],
      useFactory: async (factoryManager: EntityPersisterFactoryManager) => {
        return new InfraAggregateRootRepositoryManager(featureName, factoryManager, domainErrors);
      }
    };
  }
}