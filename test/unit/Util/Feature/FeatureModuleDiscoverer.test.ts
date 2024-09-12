/**
 * @group unit
 */

import { FeatureModuleDiscoverer } from "@/Util/Feature/FeatureModuleDiscoverer";
import { LIBS_DIRNAME } from "@test/libs";
import * as yaml from "js-yaml";

describe(FeatureModuleDiscoverer.constructor.name, () => {

  test('discoverAll', async () => {
    const discoverer = new FeatureModuleDiscoverer(LIBS_DIRNAME + "/test-lib/src");

    const current = await discoverer.discoverAll();

    expect(yaml.dump(Array.from(current.entries()).map(v => v[1].toJSON()))).toMatchSnapshot();
  });

  test('hObjectMap', async () => {
    const discoverer = new FeatureModuleDiscoverer(LIBS_DIRNAME + "/test-lib/src");

    const current = await discoverer.discoverAll();

    expect(yaml.dump(Array.from(current.entries()).map(v => Object.fromEntries(v[1].hObjectMap.entries())))).toMatchSnapshot();
  });
});
