import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';
import type { JestConfigWithTsJest } from 'ts-jest';

const rootDir = (__dirname + "/test/helper/libs/test-lib").replaceAll("\\", "/");

const jestConfig: JestConfigWithTsJest = {
  preset: "ts-jest",
  runner: "groups",
  roots: [__dirname],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>" }),
  transform: {
    '^.+\\.ts?$': ['<rootDir>/lib/Compiler/Jest', {
      rootDir,
      tsconfig: compilerOptions,
      diagnostics: false,
      isolatedModules: true,
    }]
  },
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  setupFiles: [],
  setupFilesAfterEnv: ["jest-expect-message", "<rootDir>/test/config.ts"],
  coverageDirectory: "./test/coverage",
  testEnvironment: "node",

};

export default jestConfig;

