import { FsHelper } from "@/Util/Filesystem/FsHelper";
import { execFileSync } from "node:child_process";
import ts from 'typescript';
import { FeatureMap, FeatureMeta } from "../../../Util/Feature/Meta/FeatureMeta";
import { TsTransfromerHelper } from "../TsTransformerHelper";
import type { AbstractFeatureTsTransformer } from "./AbstractFeatureTsTransformer";
import { FeatureInfraDomainModuleTsTransformer } from "./FeatureInfraDomainTsTransformer";
import { FeatureModuleTsTransformer } from "./FeatureModuleTsTransformer";
import path from "node:path";
import { FeatureModuleDiscoverer } from "../../../Util/Feature/FeatureModuleDiscoverer";
import { TsImportHelper } from "../TsImportHelper";
import { ModuleClassTsTransformer } from "../ModuleClassTsTransformer";
import type { FeatureTransformContext } from "./FeatureTransformContext";


/**
 * Adding automatic injection of message handlers, services, infra module to `[Feature]Module` source.
 * Less write, more fun !
 */
export class FeatureTsTransformer {
  private transformers: AbstractFeatureTsTransformer[];

  public constructor(
    private sourceRoot: string,
    private features: FeatureMap,
    importHelper: TsImportHelper,
  ) {

    const helpers = {
      importHelper: importHelper,
      moduleClassTransformer: new ModuleClassTsTransformer(importHelper),
      features: this.features,
    };

    this.transformers = [
      new FeatureInfraDomainModuleTsTransformer(helpers),
      new FeatureModuleTsTransformer(helpers),
    ];
  }

  public static create(sourceRoot: string, compilerDir?: string, features?: FeatureMap, needFixImportAccess = true): FeatureTsTransformer {
    sourceRoot = FsHelper.normalizePathSep(sourceRoot);
    compilerDir = compilerDir ?? FsHelper.normalizePathSep(path.dirname(path.dirname(__dirname)));
    features = features ?? this.loadFeaturesMapSync(sourceRoot, compilerDir);

    const importFromMapper = TsTransfromerHelper.createImportFromMapper(sourceRoot);
    const importHelper = new TsImportHelper(importFromMapper, needFixImportAccess);

    return new this(sourceRoot, features, importHelper);
  }

  private static loadFeaturesMapSync(sourceRoot: string, compilerDir: string): Map<string, FeatureMeta> {
    // TS transformer can't use async, but we need async code and execSync allows run async code :) Hack of day !
    const output = execFileSync('node', [`${compilerDir}/Transformer/Feature/discoverer.js`, sourceRoot], {
      windowsHide: true,
      shell: false,
      timeout: 60 * 1000
    });
    const featuresPlain = JSON.parse(output.toString());
    return FeatureMeta.parseMap(featuresPlain);
  }

  public transform(source: ts.SourceFile, context: ts.TransformationContext): ts.SourceFile {
    const sourceFilePath = FsHelper.normalizePathSep(source.fileName);
    const feature = this.getFeatureOfPath(sourceFilePath);
    if (!feature) {
      return source;
    }

    const sourceFilePathWithoutRoot = sourceFilePath.substring(this.sourceRoot.length + 1);
    const transformContext: FeatureTransformContext = {
      feature,
      sourceFilePathWithoutRoot,
      tsContext: context,
      diagnostics: [],
    };
    for (const t of this.transformers) {
      if (t.supports(sourceFilePathWithoutRoot, feature)) {
        const transformed = t.transform(source, transformContext);
        return transformed;
      }
    }

    return source;
  }

  private getFeatureOfPath(sourceFilePath: string): FeatureMeta | null {
    const featureName = FeatureModuleDiscoverer.extractFeatureNameFromPath(this.sourceRoot, sourceFilePath);
    if (!featureName) {
      return null;
    }

    return this.features.get(featureName) as FeatureMeta;
  }

  public supports(sourceFilePath: string, featureName: string): boolean {
    const feature = this.features.get(featureName)!;
    for (const t of this.transformers) {
      if (t.supports(sourceFilePath, feature)) {
        return true;
      }
    }

    return false;
  }
}