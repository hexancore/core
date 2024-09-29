/**
 * @group integration
 */

import { FeatureTsTransformerTestHelper } from "@test/FeatureTsTransformerTestHelper";
import { BookCreateCommand } from "@test/libs/test-lib/src";

describe("HObject.HCommand", () => {
  let helper: FeatureTsTransformerTestHelper;

  beforeAll(() => {
    helper = FeatureTsTransformerTestHelper.create();
  });

  test("transform", () => {
    const sourceFilePath = `/Book/Application/Book/Command/Create/BookCreateCommand.ts`;
    const out = helper.transform(sourceFilePath);

    expect(out).toMatchSnapshot();
  });

  describe("parse", () => {
    test("when valid", () => {
      const current = BookCreateCommand.parse({ title: "test" });

      expect(current).toMatchSnapshot();
    });
    test("when invalid", () => {
      const current = BookCreateCommand.parse("invalid");

      expect(current).toMatchSnapshot();
    });
  });

  test("toJSON", () => {
    const current = BookCreateCommand.cs({ title: "test" });

    expect(JSON.stringify(current, undefined, 2)).toMatchSnapshot();
  });
});


