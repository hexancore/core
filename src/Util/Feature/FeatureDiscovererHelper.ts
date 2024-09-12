import { fdir, type PathsOutput } from "fdir";
import { readFile } from 'node:fs/promises';
import { pathExists } from 'fs-extra';
import path from "node:path";

export class FeatureDiscovererHelper {

  public static createDirClawler(): fdir<PathsOutput> {
    return (new fdir()).withPathSeparator("/");
  }

  public static async crawlDirOnly(dir: string): Promise<PathsOutput> {
    const crawler = this.createDirClawler()
      .onlyDirs()
      .withFullPaths()
      .withMaxDepth(1);

    const dirs = await crawler.crawl(dir).withPromise();
    dirs.shift();
    return dirs;
  }

  public static async isUsing(filePath: string, classOrInterfaceName: string): Promise<boolean> {
    return (await readFile(filePath)).indexOf(classOrInterfaceName, 0, 'utf8') !== -1;
  }

  public static async discoverInDirOnlyDirs<T>(
    dir: string,
    featureDir: string,
    mapper: (name: string, pathInFeature: string, filePath: string) => T | Promise<T>,
    filter?: (filePath: string) => boolean | Promise<boolean>
  ): Promise<T[]> {
    if (!(await pathExists(dir))) {
      return [];
    }

    const dirIt = (new fdir()).withPathSeparator("/").onlyDirs().withMaxDepth(1).withFullPaths();
    dirIt.filter((path) => !path.endsWith("index.ts"));
    const filePaths = await dirIt.crawl(dir).withPromise();
    filePaths.shift();
    const metas: T[] = [];
    for (const p of filePaths) {
      if (filter) {
        let result = filter(p);
        result = result instanceof Promise ? await result : result;
        if (!result) {
          continue;
        }
      }

      const name = path.basename(p);
      const pathInFeature = this.relativePathInFeature(p, featureDir,true);
      const mapped = mapper(name, pathInFeature, p);

      metas.push(mapped instanceof Promise ? await mapped : mapped);
    }

    return metas;
  }


  public static async discoverInDir<T>(
    dir: string,
    featureDir: string,
    mapper: (name: string, pathInFeature: string, filePath: string) => T | Promise<T>,
    filter?: (filePath: string) => boolean | Promise<boolean>
  ): Promise<T[]> {
    if (!(await pathExists(dir))) {
      return [];
    }

    const dirIt = (new fdir()).withPathSeparator("/").withMaxDepth(0).withFullPaths();
    dirIt.filter((path) => !path.endsWith("index.ts"));
    const filePaths = await dirIt.crawl(dir).withPromise();
    const metas: T[] = [];
    for (const p of filePaths) {
      if (filter) {
        let result = filter(p);
        result = result instanceof Promise ? await result : result;
        if (!result) {
          continue;
        }
      }

      const name = path.basename(p, '.ts');
      const pathInFeature = this.relativePathInFeature(p, featureDir, false);
      const mapped = mapper(name, pathInFeature, p);

      metas.push(mapped instanceof Promise ? await mapped : mapped);
    }

    return metas;
  }

  public static relativePathInFeature(path: string, featureDir: string, pathIsDir: boolean): string {
    return path.substring(featureDir.length + 1, path.length - (pathIsDir ? 1 : 3));
  }

}