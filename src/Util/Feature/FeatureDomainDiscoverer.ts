import { pathExists } from 'fs-extra';
import { type PathsOutput } from "fdir";
import path from "node:path";
import { FeatureAggregateRootMeta, FeatureDomainMeta, FeatureEntityMeta, FeatureValueObjectMeta } from "./Meta";
import { FeatureDiscovererHelper } from "./FeatureDiscovererHelper";

export class FeatureDomainDiscoverer {

  public async discover(featureDir: string): Promise<FeatureDomainMeta> {
    return new FeatureDomainMeta(
      await this.discoverAggregateRoots(featureDir),
      await this.discoverValueObjects('', path.join(featureDir, 'Domain'), featureDir),
    );
  }

  private async discoverAggregateRoots(featureDir: string): Promise<FeatureAggregateRootMeta[]> {
    const dirs: PathsOutput = await FeatureDiscovererHelper.crawlDirOnly(path.join(featureDir, "Domain"));

    const roots: FeatureAggregateRootMeta[] = [];
    for (const rootDir of dirs) {
      const name = path.basename(rootDir, '.ts');
      // skip not aggregates
      if (name === 'Service' || name === 'Shared' || name === 'ValueObject' || name === 'Event') {
        continue;
      }

      const entities = await this.discoverAggregateRootEntities(featureDir, rootDir, name);
      const valueObjects = await this.discoverValueObjects(name, rootDir, featureDir);
      roots.push(new FeatureAggregateRootMeta(name, entities, valueObjects));
    }

    return roots;
  }

  private async discoverAggregateRootEntities(featureDir: string, rootDir: string, aggregateRootName: string): Promise<FeatureEntityMeta[]> {
    return FeatureDiscovererHelper.discoverInDir(rootDir, featureDir,
      (name) => new FeatureEntityMeta(name, aggregateRootName),
      (filePath) => filePath.endsWith('.ts') && FeatureDiscovererHelper.isUsing(filePath, "AbstractEntity")
    );
  }

  private async discoverValueObjects(context: string, contextDir: string, featureDir: string): Promise<FeatureValueObjectMeta[]> {
    const sharedValueObjectDir = path.join(contextDir, 'Shared/ValueObject');
    let sharedValueObjects: FeatureValueObjectMeta[] | null = null;
    if (await pathExists(sharedValueObjectDir)) {
      sharedValueObjects = await FeatureDiscovererHelper.discoverInDir(sharedValueObjectDir, featureDir,
        (name) => new FeatureValueObjectMeta(name, context, true)
      );
    }

    const valueObjectDir = path.join(contextDir, 'ValueObject');
    let valueObjects: FeatureValueObjectMeta[] | null = null;
    if (await pathExists(valueObjectDir)) {
      valueObjects = await FeatureDiscovererHelper.discoverInDir(valueObjectDir, featureDir,
        (name) => new FeatureValueObjectMeta(name, '', false),
      );
    }

    if (sharedValueObjects) {
      return valueObjects ? [...sharedValueObjects, ...valueObjects] : sharedValueObjects;
    }

    return valueObjects ?? [];
  }
}