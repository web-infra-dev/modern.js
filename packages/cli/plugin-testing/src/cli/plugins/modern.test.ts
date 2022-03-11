import { mergeUserJestConfig } from './modern';

describe('modern plugin', () => {
  test('mergeUserJestConfig support object', () => {
    const testUtils = {
      _jestConfig: {
        a: 1,
      },
      get jestConfig() {
        return this._jestConfig;
      },
      testConfig: {
        jest: {
          b: 1,
        },
      },
      mergeJestConfig(config: Record<string, string>) {
        Object.assign(this._jestConfig, config);
      },
    };

    mergeUserJestConfig(testUtils);

    expect(testUtils.jestConfig).toEqual({
      a: 1,
      b: 1,
    });
  });

  test('mergeUserJestConfig support function', () => {
    const testUtils = {
      _jestConfig: {
        a: 1,
      },
      get jestConfig() {
        return this._jestConfig;
      },
      testConfig: {
        jest: (jestConfig: Record<string, number>) => {
          jestConfig.b = 1;
        },
      },
      mergeJestConfig(config: Record<string, string>) {
        Object.assign(this._jestConfig, config);
      },
    };

    mergeUserJestConfig(testUtils);
    expect(testUtils.jestConfig).toEqual({
      a: 1,
      b: 1,
    });
  });
});
