/**
 * @group integration
 */

import { TsTransformerTestHelper } from "@/Compiler/Test/TsTransformerTestHelper";
import { FeatureTsTransformer } from "@/Compiler/Transformer/Feature/FeatureTsTransformer";
import { HObjectTsTransformer } from "@/Compiler/Transformer/Feature/HObject/HObjectTsTransformer";
import { LIBS_DIRNAME } from "@test/libs";
import type { TransformerFactory, SourceFile } from "typescript";

describe(HObjectTsTransformer.constructor.name, () => {
  const helper = TsTransformerTestHelper.createFromTsConfig(process.cwd() + "/tsconfig.json");
  const sourceRoot = LIBS_DIRNAME + "/test-lib/src";
  let transformer: FeatureTsTransformer;

  let transformerFactory: TransformerFactory<SourceFile>;

  beforeAll(() => {

    const compilerRoot = process.cwd() + "/lib/Compiler";
    transformer = FeatureTsTransformer.create(sourceRoot, compilerRoot);
    transformerFactory = helper.createTransformerFactory(transformer.transform.bind(transformer));
  });

  test("transform: Command", () => {
    const sourceFilePath = `${sourceRoot}/Book/Application/Book/Command/Create/BookCreateCommand.ts`;

    const out = helper.transformExistingAndReturnAsString(sourceFilePath, [transformerFactory]);

    expect(out).toMatchSnapshot();
  });

  test("transform: Query", () => {
    const sourceFilePath = `${sourceRoot}/Book/Application/Book/Query/GetById/BookGetByIdQuery.ts`;

    const out = helper.transformExistingAndReturnAsString(sourceFilePath, [transformerFactory]);

    expect(out).toMatchSnapshot();
  });

  test("transform: DTO", () => {
    const sourceFilePath = `${sourceRoot}/Book/Application/Book/Dto/TestTransformDto.ts`;

    const out = helper.transformExistingAndReturnAsString(sourceFilePath, [transformerFactory]);

    expect(out).toMatchSnapshot();
  });

  test("transform: ValueObject", () => {
    const sourceFilePath = `${sourceRoot}/Book/Domain/Book/Shared/ValueObject/BookId.ts`;

    const out = helper.transformExistingAndReturnAsString(sourceFilePath, [transformerFactory]);

    expect(out).toMatchSnapshot();
  });

});


