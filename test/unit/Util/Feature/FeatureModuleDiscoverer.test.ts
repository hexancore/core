/**
 * @group unit
 */

import { FeatureModuleDiscoverer } from "@/Util/Feature/FeatureModuleDiscoverer";
import { LIBS_DIRNAME } from "@test/libs";

describe(FeatureModuleDiscoverer.constructor.name, () => {
  test('discoverAll', async () => {
    const discoverer = new FeatureModuleDiscoverer(LIBS_DIRNAME + "/test-lib/src");

    const current = await discoverer.discoverAll();

    expect(current).toMatchSnapshot();
  });
});
