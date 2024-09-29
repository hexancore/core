/**
 * @group integration
 */

import { FeatureTsTransformerTestHelper } from "@test/FeatureTsTransformerTestHelper";
import { BookGetByIdQuery } from "@test/libs/test-lib/src";

describe("HObject.HQuery", () => {
  let helper: FeatureTsTransformerTestHelper;

  beforeAll(() => {
    helper = FeatureTsTransformerTestHelper.create();
  });

  test("transform", () => {
    const sourceFilePath = `/Book/Application/Book/Query/GetById/BookGetByIdQuery.ts`;
    const out = helper.transform(sourceFilePath);

    expect(out).toMatchSnapshot();
  });

  describe("parse", () => {
    test("when valid", () => {
      const current = BookGetByIdQuery.parse({ title: "test" });

      expect(current).toMatchSnapshot();
    });
    test("when invalid", () => {
      const current = BookGetByIdQuery.parse("invalid");

      expect(current).toMatchSnapshot();
    });
  });

  test("toJSON", () => {
    const current = BookGetByIdQuery.cs({ title: "test" });

    expect(JSON.stringify(current, undefined, 2)).toMatchSnapshot();
  });
});


