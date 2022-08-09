import { merge } from '@modern-js/utils/lodash';
import { JestConfig, TestConfig } from '../types';

class TestConfigOperator {
  private _testConfig: TestConfig;

  private _jestConfig: JestConfig;

  private readonly userJestConfig?:
    | JestConfig
    | ((jestConfig: JestConfig) => JestConfig);

  private readonly defaultTestConfig: TestConfig = {
    transformer: 'babel-jest',
  };

  constructor(testConfig: TestConfig) {
    this._testConfig = testConfig;
    this._jestConfig = {};
    this.userJestConfig = testConfig.jest;
    this.initial();
  }

  private initial() {
    this._testConfig = merge({}, this.defaultTestConfig, this.testConfig);
  }

  get jestConfig() {
    return this._jestConfig;
  }

  get testConfig() {
    return this._testConfig;
  }

  public mergeJestConfig(sourceConfig: JestConfig) {
    this._jestConfig = merge({}, this._jestConfig, sourceConfig);
  }

  public setJestUserConfig() {
    const { userJestConfig } = this;
    if (typeof userJestConfig === 'object') {
      this.setJestConfig(userJestConfig);
    }
  }

  public setJestConfig(sourceConfig: JestConfig, options?: { force: boolean }) {
    if (options) {
      const { force } = options;
      if (force) {
        this._jestConfig = sourceConfig;
        return;
      }
    }
    this._jestConfig = { ...this._jestConfig, ...sourceConfig };
  }

  public getFinalConfig() {
    const { userJestConfig } = this;

    if (!userJestConfig) {
      return this._jestConfig;
    }

    if (typeof userJestConfig === 'function') {
      return userJestConfig(this._jestConfig);
    }

    return this.jestConfig;
  }
}

export { TestConfigOperator };
