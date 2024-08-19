import type { AliasOption } from '@modern-js/utils';
import type { JestConfig } from '@modern-js/types';
import type { TestConfig } from '../types';
import { applyPatches } from './patches';
import { TestConfigOperator } from './testConfigOperator';

/**
 * Parse jest config
 */
const getJestUtils = (testConfig: TestConfig) => {
  const testOperator = new TestConfigOperator(testConfig);

  return testOperator;
};

const patchConfig = async (testOperator: TestConfigOperator) => {
  await applyPatches(testOperator);

  return testOperator.jestConfig;
};

export const DEFAULT_RESOLVER_PATH = require.resolve('./resolver');

export type UserConfig = {
  source?: {
    alias?: AliasOption;
  };
  testing?: TestConfig;
  tools?: {
    jest: JestConfig | ((config: JestConfig) => JestConfig);
  };
};

export { getJestUtils, patchConfig };
