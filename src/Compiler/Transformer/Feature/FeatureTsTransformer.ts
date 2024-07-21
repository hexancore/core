import { FsHelper } from "@/Util/Filesystem/FsHelper";
import { execFileSync } from "node:child_process";
import ts from 'typescript';
import type { FeatureModuleMap, FeatureModuleMeta } from "../../../Util/Feature/FeatureModuleMeta";
import { TsTransfromerHelper, type ImportFromMapper } from "../TsTransformerHelper";
import type { AbstractFeatureTsTransformer } from "./AbstractFeatureTsTransformer";
import { FeatureInfraDomainModuleTsTransformer } from "./FeatureInfraDomainTsTransformer";
import { FeatureModuleTsTransformer } from "./FeatureModuleTsTransformer";
import path from "node:path";
import { FeatureModuleDiscoverer } from "@/Util/Feature/FeatureModuleDiscoverer";

/**
 * Adding automatic injection of message handlers, services, infra module to `[Feature]Module` source.
 * Less write, more fun !
 */
export class FeatureTsTransformer {
  private transformers: AbstractFeatureTsTransformer[];

  public constructor(
    private sourceRoot: string,
    private features: FeatureModuleMap,
    importFromMapper: ImportFromMapper,
    needFixImportAccess = true,
  ) {

    this.transformers = [
      new FeatureInfraDomainModuleTsTransformer(importFromMapper, needFixImportAccess),
      new FeatureModuleTsTransformer(importFromMapper, needFixImportAccess),
    ];
  }

  public static create(sourceRoot: string, compilerDir?: string, features?: FeatureModuleMap, needFixImportAccess = true): FeatureTsTransformer {
    sourceRoot = FsHelper.normalizePathSep(sourceRoot);
    const importFromMapper = TsTransfromerHelper.createImportFromMapper(sourceRoot);
    compilerDir = compilerDir ?? FsHelper.normalizePathSep(path.dirname(path.dirname(__dirname)));
    features = features ?? this.loadFeaturesMapSync(sourceRoot, compilerDir);
    return new this(sourceRoot, features, importFromMapper, needFixImportAccess);
  }

  private static loadFeaturesMapSync(sourceRoot: string, compilerDir: string): Map<string, FeatureModuleMeta> {
    // TS transformer can't use async, but we need async code and execSync allows run async code :) Hack of day !
    const output = execFileSync('node', [`${compilerDir}/Transformer/Feature/discoverer.js`, sourceRoot], {
      windowsHide: true,
      shell: false,
      timeout: 60*1000
    });
    const features = JSON.parse(output.toString());
    return new Map(features);
  }

  public transform(source: ts.SourceFile, context: ts.TransformationContext): ts.SourceFile {
    const sourceFilePath = FsHelper.normalizePathSep(source.fileName);
    const feature = this.getFeatureOfPath(sourceFilePath);
    if (!feature) {
      return source;
    }

    const sourceFilePathWithoutRoot = sourceFilePath.substring(this.sourceRoot.length + 1);
    for (const t of this.transformers) {
      if (t.supports(sourceFilePathWithoutRoot, feature)) {
        const transformed = t.transform(feature, source, context);
        return transformed;
      }
    }

    return source;
  }

  private getFeatureOfPath(sourceFilePath: string): FeatureModuleMeta | null {
    const featureName = FeatureModuleDiscoverer.extractFeatureNameFromPath(this.sourceRoot, sourceFilePath);
    if (!featureName) {
      return null;
    }

    return this.features.get(featureName) as FeatureModuleMeta;
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