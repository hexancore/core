import { FeatureModuleDiscoverer } from "../../../Util/Feature/FeatureModuleDiscoverer";
// node ./lib/Compiler/Transformer/Feature/discoverer.js ./test/helper/libs/test-lib/src
async function run() {
  if (process.argv.length < 3) {
    throw new Error("Wrong execute, not given sourceRoot argument");
  }
  const sourceRoot = process.argv[2];
  const discoverer = new FeatureModuleDiscoverer(sourceRoot);
  const features = await discoverer.discoverAll();
  console.log(JSON.stringify(Array.from(features.entries())));
}

run();