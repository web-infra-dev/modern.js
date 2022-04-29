import { merge } from '@modern-js/utils/lodash';
import { JestConfig, TestConfig } from '../types';

class TestConfigOperator {
  private _testConfig: TestConfig;

  private _jestConfig: JestConfig;

  private readonly userJestConfig: any;

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

  public mergeJestConfig(commingConfig: JestConfig) {
    this._jestConfig = merge({}, this._jestConfig, commingConfig);
  }

  public setJestConfig(
    commingConfig: JestConfig,
    options?: { force: boolean },
  ) {
    if (options) {
      const { force } = options;
      if (force) {
        this._jestConfig = commingConfig;
        return;
      }
    }
    this._jestConfig = { ...this._jestConfig, ...commingConfig };
  }

  public getFinalConfig() {
    const { userJestConfig } = this;

    if (!userJestConfig) {
      return this._jestConfig;
    }

    if (typeof userJestConfig === 'function') {
      return userJestConfig(this._jestConfig);
    }

    // 确保用户设置的配置在jest配置最外层一定存在，避免有些配置在 projects 配置内不生效(https://github.com/facebook/jest/issues/9696)
    this.setJestConfig(userJestConfig);

    return this.jestConfig;
  }
}

export { TestConfigOperator };
