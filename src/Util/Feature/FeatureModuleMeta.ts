import { hash } from "node:crypto";

export interface ClassMeta {
  className: string;
  path: string;
}

export interface FeatureApplicationServiceMeta {
  className: string;
  /**
   * Name of context where service belongs.
   */
  context: string;
  /**
   * Indicate is marked with `@Injectable`
   */
  isInjectable: boolean;

  /**
   * Relative to feature root.
   */
  path: string;
}

export interface FeatureApplicationMessageMeta {
  context: string;
  className: string,
  handlerClassName: string,
  name: string;
  path: string;
}

export interface FeatureApplicationMeta {
  commands: FeatureApplicationMessageMeta[];
  queries: FeatureApplicationMessageMeta[];
  events: FeatureApplicationMessageMeta[];
  services: FeatureApplicationServiceMeta[];
}

export interface FeatureAggregateRootMeta {
  name: string;
  repositoryName: string;
  infraRepositoryName: string;
  entities: FeatureEntityMeta[];
}

export interface FeatureEntityMeta {
  name: string;
  repositoryName: string;
  infraRepositoryName: string;
}

export interface FeatureDomainMeta {
  aggregateRoots: FeatureAggregateRootMeta[];
}

export interface FeatureInfrastructureMeta {
  module: ClassMeta;
}

export type FeatureModuleMap = Map<string, FeatureModuleMeta>;

export class FeatureModuleMeta {
  public readonly name!: string;
  public readonly cacheKey!: string;

  public readonly application!: FeatureApplicationMeta;
  public readonly domain!: FeatureDomainMeta;
  public readonly infrastructure!: FeatureInfrastructureMeta;

  private constructor(props: Omit<FeatureModuleMeta, "cacheKey"> & { cacheKey?: string; }) {
    Object.assign(this, props);
    if (!this.cacheKey) {
      this.cacheKey = FeatureModuleMeta.calcCacheKey(this);
    }
  }

  public static create(props: Omit<FeatureModuleMeta, "cacheKey"> & { cacheKey?: string; }): FeatureModuleMeta {
    return new this(props);
  }

  private static calcCacheKey(meta: Omit<FeatureModuleMeta, 'cacheKey'>): string {
    let data = "";
    for (const m of meta.application.commands) {
      data += m.context + m.name;
    }

    for (const m of meta.application.queries) {
      data += m.context + m.name;
    }

    for (const m of meta.application.events) {
      data += m.context + m.name;
    }

    for (const m of meta.application.services) {
      data += m.path;
    }

    for (const r of meta.domain.aggregateRoots) {
      data += r.name;
    }

    return hash("sha1", data, "hex");
  }
}