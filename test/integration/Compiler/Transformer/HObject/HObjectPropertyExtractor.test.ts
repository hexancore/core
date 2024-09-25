/**
 * @group integration
 */

import { TsTransformerTestHelper } from "@/Compiler/Test/TsTransformerTestHelper";
import ts from "typescript";
import { TsTransfromerHelper } from "@/Compiler/Transformer/TsTransformerHelper";
import { LIBS_DIRNAME } from "@test/libs";
import type { HObjectPropertyTsMeta } from "@/Compiler/Transformer/Feature/HObject/HObjectPropertyTsMeta";
import { HObjectPropertyExtractor } from "@/Compiler/Transformer/Feature/HObject/HObjectPropertyExtractor";

describe(HObjectPropertyExtractor.constructor.name, () => {
  const helper = TsTransformerTestHelper.createFromTsConfig(process.cwd() + "/tsconfig.json");
  let extractor: HObjectPropertyExtractor;

  beforeAll(() => {
    extractor = new HObjectPropertyExtractor();
  });

  test("extract", () => {
    const sourceFilePath = LIBS_DIRNAME + "/test-lib/src/Book/Application/Book/Dto/TestTransformDto.ts";
    const diagnostics: ts.Diagnostic[] = [];
    let properties!: HObjectPropertyTsMeta[];
    const transformer = (source) => {
      ts.visitNodes(source.statements, (node) => {
        if (ts.isClassDeclaration(node)) {
          properties = extractor.extract(node,source, diagnostics);
        }
        return node;
      });

      return source;
    };

    helper.transpileModule(transformer, sourceFilePath);

    expect(properties.map(p => p.toString())).toMatchSnapshot();
    expect(TsTransfromerHelper.reportDiagnostics(diagnostics, true)).toEqual('');
  });

});


