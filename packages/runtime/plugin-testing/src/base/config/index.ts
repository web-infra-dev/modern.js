import { AliasOption } from '@modern-js/utils';
import { JestConfig } from '@modern-js/core';
import { TestConfig } from '../types';
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
  tools?: {
    jest: JestConfig | ((config: JestConfig) => JestConfig);
  };
};

export { getJestUtils, patchConfig };
