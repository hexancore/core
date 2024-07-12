import { fdir, type PathsOutput } from "fdir";
import { pathExists } from 'fs-extra';
import path from "node:path";
import { PerformanceHelper } from "./Performance/PerformanceHelper";
import { hash } from "node:crypto";
import { readFile } from 'node:fs/promises';

export interface ClassDiscovery {
  className: string;
  path: string;
}

export interface FeatureApplicationServiceInfo {
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

export interface FeatureApplicationMessageInfo {
  context: string;
  className: string,
  handlerClassName: string,
  name: string;
  path: string;
}

export interface FeatureModuleDiscovery {
  application: {
    commands: FeatureApplicationMessageInfo[];
    queries: FeatureApplicationMessageInfo[];
    events: FeatureApplicationMessageInfo[];
    services: FeatureApplicationServiceInfo[];
  };

  infrastructure: {
    module: ClassDiscovery;
  };

  cacheKey: string;
}

export class FeatureModuleDiscoverer {
  public constructor(private sourceRoot: string) {
    this.sourceRoot.replaceAll("\\", "/");
  }

  public async discoverAll(): Promise<Map<string, FeatureModuleDiscovery>> {
    const featureDirs: PathsOutput = await (new fdir())
      .onlyDirs()
      .withMaxDepth(1)
      .withPathSeparator("/")
      .crawl(this.sourceRoot)
      .withPromise();

    featureDirs.shift();
    const features = new Map<string, FeatureModuleDiscovery>();
    for (const featureDir of featureDirs) {
      const discovery = await FeatureModuleDiscoverer.discover(featureDir);
      features.set(path.basename(featureDir), discovery);
    }

    return features;
  }

  public static async discover(featureDir: string): Promise<FeatureModuleDiscovery> {
    const featureName = path.basename(featureDir);
    featureDir = featureDir.replaceAll("\\", "/");
    featureDir = featureDir.endsWith("/") ? featureDir.substring(0, featureDir.length - 1) : featureDir;
    return PerformanceHelper.measureFunction("hc.core.feature_module_discovery" + featureName, async () => {
      const contextDirs: PathsOutput = await (new fdir())
        .onlyDirs()
        .withMaxDepth(1)
        .withPathSeparator("/")
        .crawl(path.join(featureDir, "Application"))
        .withPromise();

      const commands: FeatureApplicationMessageInfo[] = [];
      const queries: FeatureApplicationMessageInfo[] = [];
      const events: FeatureApplicationMessageInfo[] = [];
      const services: FeatureApplicationServiceInfo[] = [];

      for (const contextDir of contextDirs) {
        const contextName = path.basename(contextDir);
        commands.push(...(await this.discoverMessageHandlers(contextName, contextDir, featureDir, 'Command')));
        queries.push(...(await this.discoverMessageHandlers(contextName, contextDir, featureDir, 'Query')));
        events.push(...(await this.discoverMessageHandlers(contextName, contextDir, featureDir, 'Event')));
        services.push(...(await this.discoverServices(contextName, contextDir, featureDir)));
      }

      const discovery = {
        application: {
          commands,
          queries,
          events,
          services,
        },
        infrastructure: {
          module: this.discoverInfrastructureModule(featureName)
        }
      };

      this.calcCacheHashKey(discovery);
      return discovery as FeatureModuleDiscovery;
    });
  }

  public static extractFeatureNameFromPath(sourceRoot: string, sourcePath: string): string | null {
    if (sourcePath.startsWith(sourceRoot) && sourcePath.endsWith("Module.ts")) {
      const withoutSourceRoot = sourcePath.substring(sourceRoot.length + 1);
      const withoutSourceRootSplit = withoutSourceRoot.split("/");
      return withoutSourceRootSplit.length === 2 ? withoutSourceRootSplit[0] : null;
    }

    return null;
  }

  private static async discoverMessageHandlers(context: string, contextDir: string, featureDir: string, messageType: 'Command' | 'Query' | 'Event'): Promise<FeatureApplicationMessageInfo[]> {
    const dir = contextDir + `${messageType}`;
    if (!(await pathExists(dir))) {
      return [];
    }

    const dirIt = (new fdir()).withPathSeparator("/").onlyDirs().withMaxDepth(1).withFullPaths();
    const messagePaths = await dirIt.crawl(dir).withPromise();
    messagePaths.shift();
    const messages: FeatureApplicationMessageInfo[] = [];
    for (const messagePath of messagePaths) {
      const name = path.basename(messagePath);
      messages.push({
        context: context,
        name: path.basename(messagePath),
        className: `${context}${name}${messageType}`,
        handlerClassName: `${context}${name}${messageType}Handler`,
        path: messagePath.substring(featureDir.length + 1, messagePath.length - 1),

      });
    }

    return messages;
  }

  private static async discoverServices(context: string, contextDir: string, featureDir: string): Promise<FeatureApplicationServiceInfo[]> {
    const dir = contextDir + `Service`;
    if (!(await pathExists(dir))) {
      return [];
    }

    const dirIt = (new fdir()).withPathSeparator("/").withFullPaths();
    dirIt.filter((path) => !path.endsWith("index.ts"));

    const filePaths = await dirIt.crawl(dir).withPromise();
    const classes: FeatureApplicationServiceInfo[] = [];
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

  private static discoverInfrastructureModule(featureName: string): ClassDiscovery {
    const className = `${featureName}InfrastructureModule`;
    const filePath = `Infrastructure/${className}`;
    return { className, path: filePath };
  }

  private static calcCacheHashKey(discovery: Omit<FeatureModuleDiscovery, 'cacheKey'>) {
    let hashSource = "";
    for (const c of discovery.application.commands) {
      hashSource += c.context + c.name;
    }
    for (const c of discovery.application.queries) {
      hashSource += c.context + c.name;
    }
    for (const c of discovery.application.events) {
      hashSource += c.context + c.name;
    }
    for (const c of discovery.application.services) {
      hashSource += c.path;
    }

    discovery["cacheKey"] = hash("sha1", hashSource, "hex");
  }

}