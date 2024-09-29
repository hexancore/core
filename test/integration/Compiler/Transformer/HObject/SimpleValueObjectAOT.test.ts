/**
 * @group integration
 */

import { FeatureTsTransformerTestHelper } from "@test/FeatureTsTransformerTestHelper";
import { BookId } from "@test/libs/test-lib/src";

describe("HObject.SimpleValueObject", () => {
  let helper: FeatureTsTransformerTestHelper;

  beforeAll(() => {
    helper = FeatureTsTransformerTestHelper.create();
  });

  test("transform", () => {
    const sourceFilePath = `/Book/Domain/Book/Shared/ValueObject/BookId.ts`;
    const out = helper.transform(sourceFilePath);

    expect(out).toMatchSnapshot();
  });

  describe("parse", () => {
    test("when valid", () => {
      const current = BookId.parse(10);

      expect(current).toMatchSnapshot();
    });
    test("when invalid", () => {
      const current = BookId.parse("invalid");

      expect(current).toMatchSnapshot();
    });
  });

  test("toJSON", () => {
    const current = BookId.cs(10);

    expect(JSON.stringify(current, undefined, 2)).toMatchSnapshot();
  });
});


