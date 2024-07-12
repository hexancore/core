import { FeatureModuleDiscoverer } from '../Util/FeatureModuleDiscoverer';
import ts from 'typescript';
import { FeatureModuleTsTransformer } from './Transformer/FeatureModuleTsTransformer';
import { readFileSync } from 'fs';
import path from 'path';
import { FsHelper } from '../Util/Filesystem/FsHelper';

let transformerProgramContext: {
  sourceRoot: string,
  transformPredicate: (sourceFile: ts.SourceFile) => boolean;
  featureModuleTransformer: FeatureModuleTsTransformer;
};

let pluginConfigContext: { sourceRoot?: string; };

function initTransformerContext(context: ts.TransformationContext) {
  if (!pluginConfigContext.sourceRoot) {
    pluginConfigContext.sourceRoot = context.getCompilerOptions().rootDir + "/src";
  }

  const sourceRoot = pluginConfigContext.sourceRoot = FsHelper.normalizePathSep(pluginConfigContext.sourceRoot);
  const compilerDir = FsHelper.normalizePathSep(__dirname);
  transformerProgramContext = {
    sourceRoot,
    transformPredicate: (source: ts.SourceFile) => FsHelper.normalizePathSep(source.fileName).startsWith(sourceRoot),
    featureModuleTransformer: FeatureModuleTsTransformer.create(sourceRoot, compilerDir)
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
        const featureModuleName = FeatureModuleDiscoverer.extractFeatureNameFromPath(transformerProgramContext.sourceRoot, source.fileName);
        if (featureModuleName) {
          return transformerProgramContext.featureModuleTransformer.transform(featureModuleName, source, context);
        }
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
