import { type PathsOutput } from "fdir";
import path from "node:path";
import { FeatureDiscovererHelper } from "./FeatureDiscovererHelper";
import { FeatureApplicationCommandMeta, FeatureApplicationMeta, FeatureApplicationQueryMeta, FeatureApplicationServiceMeta, FeatureDtoMeta } from "./Meta";

export class FeatureApplicationDiscoverer {

  public async discover(featureDir: string): Promise<FeatureApplicationMeta> {
    const contextDirs: PathsOutput = await FeatureDiscovererHelper.crawlDirOnly(path.join(featureDir, "Application"));

    const commands: FeatureApplicationCommandMeta[] = [];
    const queries: FeatureApplicationQueryMeta[] = [];
    const dtos: FeatureDtoMeta[] = [];
    const services: FeatureApplicationServiceMeta[] = [];

    for (const contextDir of contextDirs) {
      const contextName = path.basename(contextDir);
      commands.push(...(await this.discoverCommands(contextName, contextDir, featureDir)));
      queries.push(...(await this.discoverQueries(contextName, contextDir, featureDir)));
      services.push(...(await this.discoverServices(contextName, contextDir, featureDir)));
      dtos.push(...(await this.discoverDtos(contextName, contextDir, featureDir)));
    }

    return new FeatureApplicationMeta(commands, queries, dtos, services);
  }

  private async discoverCommands(context: string, contextDir: string, featureDir: string): Promise<FeatureApplicationCommandMeta[]> {
    return FeatureDiscovererHelper.discoverInDirOnlyDirs(
      contextDir + 'Command',
      featureDir,
      (name) => new FeatureApplicationCommandMeta(name, context));
  }

  private async discoverQueries(context: string, contextDir: string, featureDir: string): Promise<FeatureApplicationQueryMeta[]> {
    return FeatureDiscovererHelper.discoverInDirOnlyDirs(
      contextDir + 'Query',
      featureDir,
      (name) => new FeatureApplicationQueryMeta(name, context));
  }

  private async discoverDtos(context: string, contextDir: string, featureDir: string): Promise<FeatureDtoMeta[]> {
    return FeatureDiscovererHelper.discoverInDir(contextDir + 'Dto', featureDir,
      (name, pathInFeature) => new FeatureDtoMeta(name, context, pathInFeature)
    );
  }

  private async discoverServices(context: string, contextDir: string, featureDir: string): Promise<FeatureApplicationServiceMeta[]> {
    return FeatureDiscovererHelper.discoverInDir(contextDir + 'Service', featureDir,
      async (name, pathInFeature, filePath) =>
        new FeatureApplicationServiceMeta(name, context, pathInFeature, await FeatureDiscovererHelper.isUsing(filePath, "@Injectable("))
    );
  }
}