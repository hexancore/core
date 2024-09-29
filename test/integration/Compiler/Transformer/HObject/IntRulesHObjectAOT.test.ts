/**
 * @group integration
 */

import { FeatureTsTransformerTestHelper } from "@test/FeatureTsTransformerTestHelper";
import { IntTestDto } from "@test/libs/test-lib/src/Book/Application/Book/Dto/IntTestDto";

describe("HObject.Rules.Int", () => {
  let helper: FeatureTsTransformerTestHelper;
  const validPlain = {
    field: -10,
    optionalField: -20,

    minField: -100,
    maxField: 100,

    betweenField: -50,

    ltField: -100,
    gtField: -99,
    betweenExclusivelyField: -50,

    arrayField: [-1, -2, -3],
    optionalArrayField: [-10, -20, -30],

    maxArrayField: [-1, -2, -3],
  };

  beforeAll(() => {
    helper = FeatureTsTransformerTestHelper.create();
  });

  test("transform", () => {
    const sourceFilePath = `/Book/Application/Book/Dto/IntTestDto.ts`;
    const out = helper.transform(sourceFilePath);

    expect(out).toMatchSnapshot();
  });

  describe("parse", () => {
    test("when valid", () => {
      const current = IntTestDto.parse(validPlain);

      expect(current).toMatchSnapshot();
    });
    test("when invalid", () => {
      const current = IntTestDto.parse({optionalField: "invalid",  optionalArrayField: "invalid"});

      expect(current).toMatchSnapshot();
    });
  });

  test("toJSON", () => {
    const current = IntTestDto.cs(validPlain);

    expect(JSON.stringify(current, undefined, 2)).toMatchSnapshot();
  });
});


