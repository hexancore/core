import { FeatureInfrastructureMeta, type FeatureClassMeta } from "./Meta";

export class FeatureInfrastructureDiscoverer {

  public async discover(featureDir: string, featureName: string): Promise<FeatureInfrastructureMeta> {
    return new FeatureInfrastructureMeta(
      this.discoverInfrastructureModule(featureName)
    );

  }

  private discoverInfrastructureModule(featureName: string): FeatureClassMeta {
    const className = `${featureName}InfraModule`;
    const pathInFeature = `Infrastructure/${className}`;
    return { name: className, path: pathInFeature, filePath: pathInFeature + '.ts' };
  }
}