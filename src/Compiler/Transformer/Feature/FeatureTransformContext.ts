import type ts from "typescript";
import type { FeatureMeta } from "../../../Util/Feature/Meta/FeatureMeta";
import type { FeatureSourcePath } from "../../../Util/Feature/FeatureModuleDiscoverer";

export interface FeatureTransformContext {
  source: ts.SourceFile;
  featureSourcePath: FeatureSourcePath;
  feature: FeatureMeta;
  tsContext: ts.TransformationContext;
  diagnostics: ts.Diagnostic[];
}