/**
 * @group integration
 */
import { NonMethodProperties } from "@hexancore/common";
import { FeatureTsTransformerTestHelper } from "@test/FeatureTsTransformerTestHelper";
import { ArrayItemsTestDto } from "@test/libs/test-lib/src/Book/Application/Book/Dto/ArrayItemsTestDto";

describe("HObject.Rules.ArrayItems", () => {
  let helper: FeatureTsTransformerTestHelper;
  const validPlain: NonMethodProperties<ArrayItemsTestDto> = {
    arrayMinItemsField: [1, 2, 3],
    arrayMaxItemsField: [1, 2],
    arrayExaclyItemsField: [1, 2],
    arrayBetweenItemsField: [1],
    optionalArrayItemsField: [1, 2, 3]
  };

  beforeAll(() => {
    helper = FeatureTsTransformerTestHelper.create();
  });

  test("transform", () => {
    const sourceFilePath = `/Book/Application/Book/Dto/ArrayItemsTestDto.ts`;
    const out = helper.transform(sourceFilePath);

    expect(out).toMatchSnapshot();
  });

  describe("parse", () => {
    test("when valid", () => {
      const current = ArrayItemsTestDto.parse(validPlain);

      expect(current).toMatchSnapshot();
    });
    test("when invalid", () => {
      const current = ArrayItemsTestDto.parse({
        arrayMinItemsField: [],
        arrayMaxItemsField: [1,2,3],
        arrayExaclyItemsField: [],
        arrayBetweenItemsField: [],
        optionalArrayItemsField: []
      });

      expect(current).toMatchSnapshot();
    });
  });

  test("toJSON", () => {
    const current = ArrayItemsTestDto.cs(validPlain);

    expect(JSON.stringify(current, undefined, 2)).toMatchSnapshot();
  });
});


