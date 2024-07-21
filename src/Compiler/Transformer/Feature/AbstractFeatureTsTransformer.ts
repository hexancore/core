import ts from 'typescript';
import type { FeatureModuleMeta } from "../../../Util/Feature/FeatureModuleMeta";
import { ModuleClassTsTransformer } from '../ModuleClassTsTransformer';
import { type ImportFromMapper } from '../TsTransformerHelper';

export abstract class AbstractFeatureTsTransformer {
  protected moduleClassTransformer: ModuleClassTsTransformer;

  public constructor(protected importFromMapper: ImportFromMapper, needFixImportAccess = true) {
    this.moduleClassTransformer = new ModuleClassTsTransformer(importFromMapper, needFixImportAccess);
  }

  public abstract transform(feature: FeatureModuleMeta, source: ts.SourceFile, context: ts.TransformationContext): ts.SourceFile;

  public abstract supports(sourceFilePath: string, feature: FeatureModuleMeta): boolean;

}