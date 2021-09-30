import { TestConfigOperator } from '../testConfigOperator';

/**
 * Merge config from testConfig.jest
 */
export const patchMergeUserJestConfig = async (
  testOperator: TestConfigOperator,
) => {
  const resolveJestConfig = testOperator.testConfig.jest;

  // Indicate `resolveJestConfig` is a jest config object
  if (resolveJestConfig && typeof resolveJestConfig !== 'function') {
    testOperator.mergeJestConfig(resolveJestConfig);
  }

  if (typeof resolveJestConfig === 'function') {
    await resolveJestConfig(testOperator.jestConfig);
  }
};
