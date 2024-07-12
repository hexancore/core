import { TsJestTransformerOptions } from "ts-jest";
import { HcJestTransformer, type HcJestTransformerOptions } from "./HcJestTransformer";
import type { AsyncTransformer } from '@jest/transform';

let cachedTransformer;

export default {
  async createTransformer(options: HcJestTransformerOptions): Promise<AsyncTransformer<TsJestTransformerOptions>> {
    if (!cachedTransformer) {
      if (!options.rootDir) {
        throw new Error("Undefined rootDir in jest.config.ts `transform`");
      }

      const t = await HcJestTransformer.create(options);
      cachedTransformer = {
        process: t.process.bind(t),
        processAsync: t.processAsync.bind(t),
        getCacheKey: t.getCacheKey.bind(t),
        getCacheKeyAsync: t.getCacheKeyAsync.bind(t)
      };
    }

    return cachedTransformer;
  },
};