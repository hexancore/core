import { TsTransformerTestHelper } from "@/Compiler/Test/TsTransformerTestHelper";
import { FeatureTsTransformer } from "@/Compiler/Transformer/Feature/FeatureTsTransformer";
import type { TransformerFactory, SourceFile } from "typescript";
import { LIBS_DIRNAME } from "./libs";
import { ESLint } from "eslint";

// EXPERIMENTAL: check generated code linting
async function lint(code: string) {
  const eslint = new ESLint({
    baseConfig: {
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      env: { node: true, es6: true },
      globals: {
        common_1: "readonly",
      },
      rules: {
        "semi": ["error", "always"],
      },
    },
  });

  const results = await eslint.lintText(code);

  const formatter = await eslint.loadFormatter("stylish");
  return results[0].output;
}

export class FeatureTsTransformerTestHelper {
  private constructor(
    private transformHelper: TsTransformerTestHelper,
    private transformerFactory: TransformerFactory<SourceFile>,
    private sourceRoot: string

  ) {

  }

  public static create(): FeatureTsTransformerTestHelper {
    const tsConfigFilePath = process.cwd() + "/tsconfig.json";
    const helper = TsTransformerTestHelper.createFromTsConfig(tsConfigFilePath);

    const sourceRoot = LIBS_DIRNAME + "/test-lib/src";
    const compilerRoot = process.cwd() + "/lib/Compiler";
    const transformer = FeatureTsTransformer.create(sourceRoot, compilerRoot);

    const transformerFactory = helper.createTransformerFactory(transformer.transform.bind(transformer));

    return new FeatureTsTransformerTestHelper(helper, transformerFactory, sourceRoot);

  }

  public transform(sourceFilePath: string): string {
    return this.transformHelper.transformExistingAndReturnAsString(this.sourceRoot + "/" + sourceFilePath, [this.transformerFactory]);
  }

}