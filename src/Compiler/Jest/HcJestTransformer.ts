import { FeatureModuleDiscoverer } from '../../Util/Feature/FeatureModuleDiscoverer';
import type { AsyncTransformer, TransformedSource } from '@jest/transform';
import { hash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { TsJestTransformer, type TsJestTransformerOptions, type TsJestTransformOptions } from 'ts-jest';
import { TsTransfromerHelper } from '../Transformer/TsTransformerHelper';
import ts from 'typescript';
import { FeatureTsTransformer } from '../Transformer/Feature/FeatureTsTransformer';
import { FsHelper } from '@/Util/Filesystem/FsHelper';

export type HcJestTransformerOptions = TsJestTransformerOptions & { rootDir: string; tmpDir: string; };
export const HC_TYPESCRIPT_TRANSFORMER_MODULE_PATH = '@hexancore/core/compiler/transformer';

export class HcJestTransformer implements AsyncTransformer<HcJestTransformerOptions> {
  private sourceRoot!: string;
  private compilerOptions: any;
  private tsJestTransformer: TsJestTransformer;

  private featureTsTransformer!: FeatureTsTransformer;
  private featuresHashMap: Map<string, string>;

  private tmpDir!: string;

  protected constructor(options: HcJestTransformerOptions) {
    this.processOptions(options);
    this.tsJestTransformer = new TsJestTransformer(options);
    this.featuresHashMap = new Map();
  }

  private processOptions(options: HcJestTransformerOptions) {
    this.compilerOptions = options.tsconfig;

    options.rootDir = options.rootDir.replaceAll("\\", "/");
    this.sourceRoot = options.rootDir + "/src";
    options.tsconfig = options.tsconfig ?? `${options.rootDir}/tsconfig.test.json`;
  }

  private setupTransformedTmpDir(options: TsJestTransformOptions): void {
    if (this.tmpDir) {
      return;
    }

    const projectHash = hash('md5', this.sourceRoot);

    this.tmpDir = options.config.cacheDirectory + '/hcjest-' + projectHash;
    this.tmpDir = FsHelper.normalizePathSep(this.tmpDir);
    if (!existsSync(this.tmpDir)) {
      mkdirSync(this.tmpDir, { recursive: true });
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
      this.featuresHashMap.set(name, discovery.cacheKey);
    }

    this.featureTsTransformer = FeatureTsTransformer.create(this.sourceRoot, undefined, features, false);
  }

  public get canInstrument(): boolean {
    return false;
  }

  public process(sourceText: string, sourcePath: string, options: TsJestTransformOptions): TransformedSource {
    sourcePath = FsHelper.normalizePathSep(sourcePath);
    const featureName = this.extractFeatureNameFromPath(sourcePath);
    if (!featureName || !this.featureTsTransformer.supports(sourcePath, featureName)) {
      return this.tsJestTransformer.process(sourceText, sourcePath, options);
    }

    return this.processFeatureSourceFile(featureName, sourceText, sourcePath, options);
  }

  public async processAsync(
    sourceText: string,
    sourcePath: string,
    options: TsJestTransformOptions,
  ): Promise<TransformedSource> {
    sourcePath = FsHelper.normalizePathSep(sourcePath);
    const featureName = this.extractFeatureNameFromPath(sourcePath);
    if (!featureName || !this.featureTsTransformer.supports(sourcePath, featureName)) {
      return this.tsJestTransformer.processAsync(sourceText, sourcePath, options);
    }

    return this.processFeatureSourceFile(featureName, sourceText, sourcePath, options);
  }

  private processFeatureSourceFile(featureName: string, sourceText: string, sourcePath: string, options: TsJestTransformOptions): TransformedSource {
    this.setupTransformedTmpDir(options);

    const inSourceFile = ts.createSourceFile(
      sourcePath,
      sourceText,
      this.compilerOptions.target ?? ts.ScriptTarget.Latest
    );

    const transformed = ts.transform(inSourceFile, [(context: ts.TransformationContext) => (source) => this.featureTsTransformer.transform(source, context)], this.compilerOptions);
    const outSourceFile = transformed.transformed[0];

    const printed = TsTransfromerHelper.printFile(outSourceFile);
    const tmpPath = this.tmpDir + '/' + featureName + '-' + hash('md5', sourcePath, 'hex').substring(0, 8) + '-' + path.basename(sourcePath);
    writeFileSync(tmpPath, printed);

    const outTranspile = ts.transpileModule(printed, {
      compilerOptions: this.compilerOptions,
      fileName: tmpPath
    });

    const sourceMap = JSON.parse(outTranspile.sourceMapText!);
    sourceMap.file = tmpPath;
    sourceMap.sources = [tmpPath];

    return {
      code: outTranspile.outputText,
      map: sourceMap
    };
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

  private getExtraCacheKey(sourcePath: string): string | null {
    sourcePath = FsHelper.normalizePathSep(sourcePath);
    const extracted = this.extractFeatureNameFromPath(sourcePath);
    if (extracted) {
      return this.featuresHashMap.get(extracted)!;
    }

    return null;
  }

  private extractFeatureNameFromPath(sourcePath: string): string | null {
    return FeatureModuleDiscoverer.extractFeatureNameFromPath(this.sourceRoot, sourcePath);
  }
}