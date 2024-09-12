import type ts from "typescript";
import type { FeatureMeta } from "../../../Util/Feature/Meta/FeatureMeta";

export interface FeatureTransformContext {
  feature: FeatureMeta;
  sourceFilePathWithoutRoot: string;
  tsContext: ts.TransformationContext;
  diagnostics: ts.Diagnostic[];
}