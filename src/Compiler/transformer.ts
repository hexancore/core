import { readFileSync } from 'fs';
import path from 'path';
import ts from 'typescript';
import { FsHelper } from '../Util/Filesystem/FsHelper';
import { FeatureTsTransformer } from './Transformer/Feature/FeatureTsTransformer';

let transformerProgramContext: {
  sourceRoot: string,
  transformPredicate: (sourceFile: ts.SourceFile) => boolean;
  featureTransformer: FeatureTsTransformer;
};

let pluginConfigContext: {
  sourceRoot?: string;
};

function initTransformerContext(context: ts.TransformationContext) {
  if (!pluginConfigContext.sourceRoot) {
    pluginConfigContext.sourceRoot = context.getCompilerOptions().rootDir + "/src";
  }

  const sourceRoot = pluginConfigContext.sourceRoot = FsHelper.normalizePathSep(pluginConfigContext.sourceRoot);
  transformerProgramContext = {
    sourceRoot,
    transformPredicate: (source: ts.SourceFile) => FsHelper.normalizePathSep(source.fileName).startsWith(sourceRoot),
    featureTransformer: FeatureTsTransformer.create(sourceRoot)
  };
}

export const factory = (_program: ts.Program, pluginConfig: any) => {
  pluginConfigContext = pluginConfig;

  return (context: ts.TransformationContext) => {
    if (!transformerProgramContext) {
      initTransformerContext(context);
    }

    return (source: ts.SourceFile): ts.SourceFile => {
      if (transformerProgramContext.transformPredicate(source)) {
        return transformerProgramContext.featureTransformer.transform(source, context);
      }

      return source;
    };
  };
};

export const name = "HcTransformer";
const packageVersion = JSON.parse(readFileSync(path.dirname(path.dirname(__dirname)) + "/package.json").toString())["version"];
export const version = packageVersion;

// for nx
export const before = factory;
// for ts-jest
export default factory;
