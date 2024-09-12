/**
 * @group integration
 */

import { TsTransformerTestHelper } from "@/Compiler/Test/TsTransformerTestHelper";
import { FeatureModuleTsTransformer } from "@/Compiler/Transformer/Feature/FeatureModuleTsTransformer";
import { FeatureTsTransformer } from "@/Compiler/Transformer/Feature/FeatureTsTransformer";
import { readFileSync } from "fs";
import ts from "typescript";

describe(FeatureModuleTsTransformer.constructor.name, () => {
  const helper = TsTransformerTestHelper.createFromTsConfig(process.cwd() + "/tsconfig.json");
  let transformer: FeatureTsTransformer;

  beforeAll(() => {
    const sourceRoot = process.cwd() + "/test/helper/libs/test-lib/src";
    const compilerRoot = process.cwd() + "/lib/Compiler";
    transformer = FeatureTsTransformer.create(sourceRoot, compilerRoot);
  });

  test("transform FeatureModule", () => {
    const codeFilePath = process.cwd() + "/test/helper/libs/test-lib/src/Book/BookModule.ts";
    const sourceFile = helper.createSourceFileFromExisting(codeFilePath);
    const tsConfig = JSON.parse(readFileSync(process.cwd() + "/tsconfig.json").toString());

    const out = ts.transpileModule(sourceFile.text, {
      compilerOptions: tsConfig.compilerOptions,
      fileName: codeFilePath,
      transformers: {
        before: [(context) => (sourceFile: ts.SourceFile) => transformer.transform(sourceFile, context)]
      }
    });

    expect(out.outputText).toMatchSnapshot();
  });

  test.skip("transform HObject: Command", () => {
    const sourceFilePath = process.cwd() + "/test/helper/libs/test-lib/src/Book/Application/Book/Command/Create/BookCreateCommand.ts";

    const out = helper.transpileModule(transformer.transform.bind(transformer), sourceFilePath);

    expect(out.outputText).toMatchSnapshot();
  });

});


