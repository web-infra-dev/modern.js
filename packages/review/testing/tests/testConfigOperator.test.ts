import { TestConfigOperator } from '../src/config/testConfigOperator';

describe('testConfigOperator', () => {
  test('getFinalConfig when user jest config is object', () => {
    const testConfigOperator = new TestConfigOperator({
      jest: {
        collectCoverage: true,
      },
    });

    testConfigOperator.setJestUserConfig();
    testConfigOperator.mergeJestConfig({
      testTimeout: 10000,
    });

    const finalConfig = testConfigOperator.getFinalConfig();

    expect(finalConfig).toEqual({
      collectCoverage: true,
      testTimeout: 10000,
    });
  });

  test('getFinalConfig when user jest config is function', () => {
    const testConfigOperator = new TestConfigOperator({
      jest: options => {
        options.collectCoverage = true;
        return options;
      },
    });

    testConfigOperator.setJestUserConfig();
    testConfigOperator.mergeJestConfig({
      testTimeout: 10000,
    });

    const finalConfig = testConfigOperator.getFinalConfig();

    expect(finalConfig).toEqual({
      collectCoverage: true,
      testTimeout: 10000,
    });
  });
});
