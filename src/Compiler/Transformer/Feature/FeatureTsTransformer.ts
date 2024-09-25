import { FsHelper } from "@/Util/Filesystem/FsHelper";
import { execFileSync } from "node:child_process";
import ts from 'typescript';
import { FeatureMap, FeatureMeta } from "../../../Util/Feature/Meta/FeatureMeta";
import { TsTransfromerHelper } from "../TsTransformerHelper";
import type { AbstractFeatureTsTransformer } from "./AbstractFeatureTsTransformer";
import { FeatureInfraDomainModuleTsTransformer } from "./FeatureInfraDomainTsTransformer";
import { FeatureModuleTsTransformer } from "./FeatureModuleTsTransformer";
import path from "node:path";
import { FeatureModuleDiscoverer, type FeatureSourcePath } from "../../../Util/Feature/FeatureModuleDiscoverer";
import { TsImportHelper } from "../TsImportHelper";
import { ModuleClassTsTransformer } from "../ModuleClassTsTransformer";
import type { FeatureTransformContext } from "./FeatureTransformContext";
import { HObjectTsTransformer } from "./HObject/HObjectTsTransformer";


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
      new HObjectTsTransformer(helpers),
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
    const featureSourceTransformContext = this.createFeatureSourceTransformContext(source, context);
    if (!featureSourceTransformContext) {
      return source;
    }


    for (const t of this.transformers) {
      if (t.supports(featureSourceTransformContext.featureSourcePath, featureSourceTransformContext.feature)) {
        const transformed = t.transform(source, featureSourceTransformContext);
        return transformed;
      }
    }

    return source;
  }

  private createFeatureSourceTransformContext(source: ts.SourceFile, context: ts.TransformationContext): FeatureTransformContext | null {
    const sourceFilePath = FsHelper.normalizePathSep(source.fileName);
    const featureSourcePath = FeatureModuleDiscoverer.extractFeatureNameFromPath(this.sourceRoot, sourceFilePath);
    if (!featureSourcePath) {
      return null;
    }

    const feature = this.features.get(featureSourcePath.featureName)!;
    return {
      feature,
      featureSourcePath,
      tsContext: context,
      diagnostics: [],
    };
  }

  public supports(sourcePath: FeatureSourcePath): boolean {
    const feature = this.features.get(sourcePath.featureName)!;
    for (const t of this.transformers) {
      if (t.supports(sourcePath, feature)) {
        return true;
      }
    }

    return false;
  }
}