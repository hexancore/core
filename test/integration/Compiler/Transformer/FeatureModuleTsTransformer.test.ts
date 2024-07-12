/**
 * @group integration
 */

import { TsTransformerTestHelper } from "@/Compiler/Test/TsTransformerTestHelper";
import { FeatureModuleTsTransformer } from "@/Compiler/Transformer/FeatureModuleTsTransformer";
import { readFileSync } from "fs";
import ts from "typescript";

describe(FeatureModuleTsTransformer.constructor.name, () => {
  const helper = TsTransformerTestHelper.createFromTsConfig(process.cwd() + "/tsconfig.json");
  let transformer: FeatureModuleTsTransformer;

  beforeAll(() => {
    const sourceRoot = process.cwd() + "/test/helper/libs/test-lib/src";
    const compilerRoot = process.cwd() + "/lib/Compiler";
    transformer = FeatureModuleTsTransformer.create(sourceRoot, compilerRoot);
  });

  test("transform", () => {
    const codeFilePath = process.cwd() + "/test/helper/libs/test-lib/src/Book/BookModule.ts";
    const sourceFile = helper.createSourceFileFromExisting(codeFilePath);
    const tsConfig = JSON.parse(readFileSync(process.cwd() +"/tsconfig.json").toString());

    const out = ts.transpileModule(sourceFile.text, {compilerOptions: tsConfig.compilerOptions, transformers: {
      before:  [(context) => (sourceFile: ts.SourceFile) => transformer.transform("Book", sourceFile, context)]
    }});

    expect(out.outputText).toMatchSnapshot();
  });

});


