import { fdir, type PathsOutput } from "fdir";
import { pathExists } from 'fs-extra';
import { readFile } from 'node:fs/promises';
import path from "node:path";
import { PerformanceHelper } from "../Performance/PerformanceHelper";
import { FeatureModuleMeta, type ClassMeta, type FeatureAggregateRootMeta, type FeatureApplicationMessageMeta, type FeatureApplicationMeta, type FeatureApplicationServiceMeta, type FeatureDomainMeta, type FeatureEntityMeta, type FeatureInfrastructureMeta } from "./FeatureModuleMeta";
import { FsHelper } from "../Filesystem/FsHelper";

export const CORE_FEATURE_NAME = "Core";

export class FeatureModuleDiscoverer {

  public constructor(private sourceRoot: string) {
    this.sourceRoot = FsHelper.normalizePathSep(this.sourceRoot);
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

  public async discoverAll(): Promise<Map<string, FeatureModuleMeta>> {
    const featureDirs: PathsOutput = await FeatureModuleDiscoverer.crawlDirOnly(this.sourceRoot);
    const features = new Map<string, FeatureModuleMeta>();
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

  private async discover(featureName: string, featureDir: string): Promise<FeatureModuleMeta> {
    featureDir = featureDir.endsWith("/") ? featureDir.substring(0, featureDir.length - 1) : featureDir;

    return PerformanceHelper.measureFunction("hc.core.feature_module_discovery" + featureName, async () => {
      return FeatureModuleMeta.create({
        name: featureName,
        application: await this.discoverFeatureApplication(featureDir),
        domain: await this.discoverFeatureDomain(featureDir),
        infrastructure: await this.discoverFeatureInfrastructure(featureName)
      });
    });
  }

  private async discoverFeatureApplication(featureDir: string): Promise<FeatureApplicationMeta> {
    const contextDirs: PathsOutput = await FeatureModuleDiscoverer.crawlDirOnly(path.join(featureDir, "Application"));

    const commands: FeatureApplicationMessageMeta[] = [];
    const queries: FeatureApplicationMessageMeta[] = [];
    const events: FeatureApplicationMessageMeta[] = [];
    const services: FeatureApplicationServiceMeta[] = [];

    for (const contextDir of contextDirs) {
      const contextName = path.basename(contextDir);
      commands.push(...(await this.discoverMessageHandlers(contextName, contextDir, featureDir, "Command")));
      queries.push(...(await this.discoverMessageHandlers(contextName, contextDir, featureDir, "Query")));
      events.push(...(await this.discoverMessageHandlers(contextName, contextDir, featureDir, "Event")));
      services.push(...(await this.discoverServices(contextName, contextDir, featureDir)));
    }

    return {
      commands,
      queries,
      events,
      services,
    };
  }

  private async discoverFeatureDomain(featureDir: string): Promise<FeatureDomainMeta> {
    return {
      aggregateRoots: await this.discoverAggregateRoots(featureDir),
    };
  }

  private async discoverAggregateRoots(featureDir: string): Promise<FeatureAggregateRootMeta[]> {
    const dirs: PathsOutput = await FeatureModuleDiscoverer.crawlDirOnly(path.join(featureDir, "Domain"));

    const roots: FeatureAggregateRootMeta[] = [];
    for (const rootDir of dirs) {
      const name = path.basename(rootDir);
      // Domain/Service is dir with Domain Services working on multiple aggregate roots
      if (name === "Service") {
        continue;
      }

      roots.push({
        name,
        repositoryName: name + "Repository",
        infraRepositoryName: "Infra" + name + "Repository",
        entities: await this.discoverAggregateRootEntities(rootDir)
      });
    }

    return roots;
  }

  private async discoverAggregateRootEntities(rootDir: string): Promise<FeatureEntityMeta[]> {
    const filePaths: PathsOutput = await FeatureModuleDiscoverer.createDirClawler()
      .withFullPaths()
      .withMaxDepth(0)
      .crawl(path.join(rootDir)).withPromise();

    const entities: FeatureEntityMeta[] = [];
    for (const filePath of filePaths) {
      const isEntity = (await readFile(filePath)).indexOf("AbstractEntity", 0, 'utf8') !== -1;
      if (!isEntity) {
        continue;
      }

      const name = path.basename(filePath, ".ts");
      entities.push({
        name,
        repositoryName: name + "Repository",
        infraRepositoryName: "Infra" + name + "Repository",
      });
    }

    return entities;
  }

  private async discoverMessageHandlers(context: string, contextDir: string, featureDir: string, messageKind: 'Command' | 'Query' | 'Event'): Promise<FeatureApplicationMessageMeta[]> {
    const dir = contextDir + `${messageKind}`;
    if (!(await pathExists(dir))) {
      return [];
    }

    const dirIt = (new fdir()).withPathSeparator("/").onlyDirs().withMaxDepth(1).withFullPaths();
    const messagePaths = await dirIt.crawl(dir).withPromise();
    messagePaths.shift();
    const messages: FeatureApplicationMessageMeta[] = [];
    for (const messagePath of messagePaths) {
      const name = path.basename(messagePath);
      messages.push({
        context: context,
        name: path.basename(messagePath),
        className: `${context}${name}${messageKind}`,
        handlerClassName: `${context}${name}${messageKind}Handler`,
        path: messagePath.substring(featureDir.length + 1, messagePath.length - 1),

      });
    }

    return messages;
  }

  private async discoverServices(context: string, contextDir: string, featureDir: string): Promise<FeatureApplicationServiceMeta[]> {
    const dir = contextDir + `Service`;
    if (!(await pathExists(dir))) {
      return [];
    }

    const dirIt = (new fdir()).withPathSeparator("/").withFullPaths();
    dirIt.filter((path) => !path.endsWith("index.ts"));

    const filePaths = await dirIt.crawl(dir).withPromise();
    const classes: FeatureApplicationServiceMeta[] = [];
    for (const filePath of filePaths) {
      const isInjectable = (await readFile(filePath)).indexOf("@Injectable(", 0, 'utf8') !== -1;
      classes.push({
        className: path.basename(filePath, ".ts"),
        context: context,
        isInjectable,
        path: filePath.substring(featureDir.length + 1, filePath.length - 3),
      });
    }

    return classes;
  }

  private async discoverFeatureInfrastructure(featureName: string): Promise<FeatureInfrastructureMeta> {
    return {
      module: this.discoverInfrastructureModule(featureName),
    };
  }

  private discoverInfrastructureModule(featureName: string): ClassMeta {
    const className = `${featureName}InfraModule`;
    const filePath = `Infrastructure/${className}`;
    return { className, path: filePath };
  }

  private static createDirClawler(): fdir<PathsOutput> {
    return (new fdir()).withPathSeparator("/");
  }

  private static async crawlDirOnly(dir: string): Promise<PathsOutput> {
    const crawler = this.createDirClawler()
      .onlyDirs()
      .withFullPaths()
      .withMaxDepth(1);

    const dirs = await crawler.crawl(dir).withPromise();
    dirs.shift();
    return dirs;
  }

}