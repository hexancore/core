/**
 * @group integration
 */

import { type JsonObjectType } from "@hexancore/common";
import { FeatureTsTransformerTestHelper } from "@test/FeatureTsTransformerTestHelper";
import { StringTestDto } from "@test/libs/test-lib/src/Book/Application/Book/Dto/StringTestDto";

describe("HObject.Rules.String", () => {
  let helper: FeatureTsTransformerTestHelper;
  const validPlain: JsonObjectType<StringTestDto> = {
    field: "test",
    optionalField: "test_optional",

    lengthField: "test_",
    lengthMinField: "test_min",
    lengthMaxField: "test_max",

    lengthBetweenField: "test_between",

    regexField: "ab123",

    arrayField: ["test_0", "test_1"],
    optionalArrayField: ["test_optional_0", "test_optional_1"],
  };

  beforeAll(() => {
    helper = FeatureTsTransformerTestHelper.create();
  });

  test("transform", () => {
    const sourceFilePath = `/Book/Application/Book/Dto/StringTestDto.ts`;
    const out = helper.transform(sourceFilePath);

    expect(out).toMatchSnapshot();
  });

  describe("parse", () => {
    test("when valid", () => {
      const current = StringTestDto.parse(validPlain);

      expect(current).toMatchSnapshot();
    });
    test("when invalid", () => {
      const current = StringTestDto.parse({
        field: 100,
        optionalField: 101,

        lengthField: "test_invalid",
        lengthMinField: "t",
        lengthMaxField: "test_max_invalid_1111",

        lengthBetweenField: "test_between__invalid",

        regexField: "a",
        optionalArrayField: "invalid"
      });

      expect(current).toMatchSnapshot();
    });
  });

  test("toJSON", () => {
    const current = StringTestDto.cs(validPlain);

    expect(JSON.stringify(current, undefined, 2)).toMatchSnapshot();
  });
});


