import { FeatureModuleDiscoverer } from "../Util/FeatureModuleDiscoverer";

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