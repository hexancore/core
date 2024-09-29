/**
 * @group integration
 */

import { FeatureTsTransformerTestHelper } from "@test/FeatureTsTransformerTestHelper";
import { UIntTestDto } from "@test/libs/test-lib/src/Book/Application/Book/Dto/UIntTestDto";

describe("HObject.Rules.UInt", () => {
  let helper: FeatureTsTransformerTestHelper;
  const validPlain = {
    field: 10,
    optionalField: 20,

    minField: 0,
    maxField: 100,

    betweenField: 50,

    ltField: 100,
    gtField: 99,
    betweenExclusivelyField: 50,

    arrayField: [1, 2, 3],
    optionalArrayField: [10, 20, 30],

    maxArrayField: [1, 2, 3],
  };

  beforeAll(() => {
    helper = FeatureTsTransformerTestHelper.create();
  });

  test("transform", () => {
    const sourceFilePath = `/Book/Application/Book/Dto/UIntTestDto.ts`;
    const out = helper.transform(sourceFilePath);

    expect(out).toMatchSnapshot();
  });

  describe("parse", () => {
    test("when valid", () => {
      const current = UIntTestDto.parse(validPlain);

      expect(current).toMatchSnapshot();
    });
    test("when invalid", () => {
      const current = UIntTestDto.parse({optionalField: "invalid",  optionalArrayField: "invalid"});

      expect(current).toMatchSnapshot();
    });
  });

  test("toJSON", () => {
    const current = UIntTestDto.cs(validPlain);

    expect(JSON.stringify(current, undefined, 2)).toMatchSnapshot();
  });
});


