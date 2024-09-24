import ts from 'typescript';
import type { FeatureMap, FeatureMeta } from "../../../Util/Feature/Meta/FeatureMeta";
import { ModuleClassTsTransformer } from '../ModuleClassTsTransformer';
import type { TsImportHelper } from '../TsImportHelper';
import type { FeatureTransformContext } from './FeatureTransformContext';
import type { FeatureSourcePath } from "../../../Util/Feature/FeatureModuleDiscoverer";

export interface FeatureTsTransformerHelpers {
  importHelper: TsImportHelper;
  moduleClassTransformer: ModuleClassTsTransformer;
  features: FeatureMap;
}

export abstract class AbstractFeatureTsTransformer {
  protected importHelper: TsImportHelper;
  protected moduleClassTransformer: ModuleClassTsTransformer;
  protected features: FeatureMap;

  public constructor(helpers: FeatureTsTransformerHelpers) {
    this.importHelper = helpers.importHelper;
    this.moduleClassTransformer = helpers.moduleClassTransformer;
    this.features = helpers.features;
  }

  public abstract transform(source: ts.SourceFile, context: FeatureTransformContext): ts.SourceFile;

  public abstract supports(featureSourcePath: FeatureSourcePath, feature: FeatureMeta): boolean;

}