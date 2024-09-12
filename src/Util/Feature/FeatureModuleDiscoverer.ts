import { type PathsOutput } from "fdir";
import path from "node:path";
import { FsHelper } from "../Filesystem/FsHelper";
import { PerformanceHelper } from "../Performance/PerformanceHelper";
import { FeatureApplicationDiscoverer } from "./FeatureApplicationDiscoverer";
import { FeatureDiscovererHelper } from "./FeatureDiscovererHelper";
import { FeatureDomainDiscoverer } from "./FeatureDomainDiscoverer";
import { FeatureInfrastructureDiscoverer } from "./FeatureInfrastructureDiscoverer";
import { FeatureMeta } from "./Meta/FeatureMeta";

export const CORE_FEATURE_NAME = "Core";

export class FeatureModuleDiscoverer {

  private applicationDiscoverer: FeatureApplicationDiscoverer;
  private domainDiscoverer: FeatureDomainDiscoverer;
  private infrastructureDiscoverer: FeatureInfrastructureDiscoverer;

  public constructor(private sourceRoot: string) {
    this.sourceRoot = FsHelper.normalizePathSep(this.sourceRoot);

    this.applicationDiscoverer = new FeatureApplicationDiscoverer();
    this.domainDiscoverer = new FeatureDomainDiscoverer();
    this.infrastructureDiscoverer = new FeatureInfrastructureDiscoverer();
  }

  public static extractFeatureNameFromPath(sourceRoot: string, sourcePath: string): string | null {
    if (!sourcePath.startsWith(sourceRoot)) {
      return null;
    }

    const withoutSourceRootParts = sourcePath.substring(sourceRoot.length + 1).split("/", 2);
    if (withoutSourceRootParts.length < 2) {
      return null;
    }

    const featureName = withoutSourceRootParts[0];
    return featureName === CORE_FEATURE_NAME ? null : featureName;
  }

  public async discoverAll(): Promise<Map<string, FeatureMeta>> {
    const featureDirs: PathsOutput = await FeatureDiscovererHelper.crawlDirOnly(this.sourceRoot);
    const features = new Map<string, FeatureMeta>();
    for (const featureDir of featureDirs) {
      const featureName = path.basename(featureDir);
      if (featureName === CORE_FEATURE_NAME) {
        continue;
      }

      const discovery = await this.discover(featureName, featureDir);
      features.set(featureName, discovery);
    }

    return features;
  }

  private async discover(featureName: string, featureDir: string): Promise<FeatureMeta> {
    featureDir = featureDir.endsWith("/") ? featureDir.substring(0, featureDir.length - 1) : featureDir;

    return PerformanceHelper.measureFunction("hc.core.feature_module_discovery" + featureName, async () => {
      return new FeatureMeta(
        featureName,
        await this.applicationDiscoverer.discover(featureDir),
        await this.domainDiscoverer.discover(featureDir),
        await this.infrastructureDiscoverer.discover(featureDir, featureName)
      );
    });
  }
}