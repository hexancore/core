import { FeatureModuleDiscoverer } from '../../Util/FeatureModuleDiscoverer';
import type { AsyncTransformer, TransformedSource } from '@jest/transform';
import { hash } from 'node:crypto';
import { TsJestTransformer, type TsJestTransformerOptions, type TsJestTransformOptions } from 'ts-jest';

export type HcJestTransformerOptions = TsJestTransformerOptions & { rootDir: string; };
export const HC_TYPESCRIPT_TRANSFORMER_MODULE_PATH = '@hexancore/core/compiler/transformer';

export class HcJestTransformer implements AsyncTransformer<HcJestTransformerOptions> {
  private sourceRoot!: string;
  private tsJestTransformer: TsJestTransformer;

  private featureModuleDiscoveryHashMap: Map<string, string>;

  protected constructor(options: HcJestTransformerOptions) {
    this.processOptions(options);
    this.tsJestTransformer = new TsJestTransformer(options);
    this.featureModuleDiscoveryHashMap = new Map();
  }

  private processOptions(options: HcJestTransformerOptions) {
    options.rootDir = options.rootDir.replaceAll("\\", "/");
    this.sourceRoot = options.rootDir + "/src";
    options.tsconfig = options.tsconfig ?? `${options.rootDir}/tsconfig.test.json`;
    options.astTransformers = options.astTransformers ?? ({});
    options.astTransformers.before = options.astTransformers.before ?? [];

    if (!options.astTransformers.before.find((t) => typeof t !== 'string' && (t.path === HC_TYPESCRIPT_TRANSFORMER_MODULE_PATH || t.path === './lib/Compiler/transformer'))) {
      options.astTransformers.before.push({
        path: HC_TYPESCRIPT_TRANSFORMER_MODULE_PATH,
        options: {
          sourceRoot: this.sourceRoot
        }
      });
    }
  }

  public static async create(options: HcJestTransformerOptions): Promise<HcJestTransformer> {
    const transformer = new this(options);
    await transformer.loadFeatureMap();
    return transformer;
  }

  private async loadFeatureMap(): Promise<void> {
    const discoverer = new FeatureModuleDiscoverer(this.sourceRoot);
    const features = await discoverer.discoverAll();
    for (const [name, discovery] of features.entries()) {
      this.featureModuleDiscoveryHashMap.set(name, discovery.cacheKey);
    }
  }

  public get canInstrument(): boolean {
    return false;
  }

  public process(sourceText: string, sourcePath: string, options: TsJestTransformOptions): TransformedSource {
    return this.tsJestTransformer.process(sourceText, sourcePath, options);
  }

  public processAsync(
    sourceText: string,
    sourcePath: string,
    options: TsJestTransformOptions,
  ): Promise<TransformedSource> {
    return this.tsJestTransformer.processAsync(sourceText, sourcePath, options as any) as any;
  }

  public getCacheKey(sourceText: string, sourcePath: string, transformOptions: TsJestTransformOptions): string {
    const extraCacheKey = this.getExtraCacheKey(sourcePath);
    const tsJestCacheKey = this.tsJestTransformer.getCacheKey(sourceText, sourcePath, transformOptions);
    if (extraCacheKey) {
      const combinedCacheKey = hash("sha1", tsJestCacheKey + extraCacheKey, "hex");
      return combinedCacheKey;
    }

    return tsJestCacheKey;
  }

  public async getCacheKeyAsync(sourceText: string, sourcePath: string, transformOptions: TsJestTransformOptions): Promise<string> {
    return this.getCacheKey(sourceText, sourcePath, transformOptions);
  }

  private getExtraCacheKey(sourcePath: string,): string | null {
    sourcePath = sourcePath.replaceAll("\\", "/");
    const extracted = FeatureModuleDiscoverer.extractFeatureNameFromPath(this.sourceRoot, sourcePath);
    if (extracted) {
      return this.featureModuleDiscoveryHashMap.get(extracted)!;
    }

    return null;
  }
}