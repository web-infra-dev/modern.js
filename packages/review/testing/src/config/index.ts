import { applyPatches } from './patches';
import { TestConfigOperator } from './testConfigOperator';
import { TestConfig } from '../types';

/**
 * Parse jest config
 */
const getJestUtils = (testConfig: TestConfig) => {
  const testOprator = new TestConfigOperator(testConfig);

  return testOprator;
};

const patchConfig = async (testOprator: TestConfigOperator) => {
  testOprator.getFinalConfig();
  await applyPatches(testOprator);

  return testOprator.jestConfig;
};

export { getJestUtils, patchConfig };
