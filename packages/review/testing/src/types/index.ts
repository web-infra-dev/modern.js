import { Config } from '@jest/types';

export type JestConfig = Config.InitialOptions;

export interface TestConfig {
  /**
   * Decide which transformer will be used to compile file
   * Default: babel-jest
   */
  transformer?: 'babel-jest' | 'ts-jest';

  /**
   * Original jest config
   * Doc: https://jestjs.io/docs/configuration
   */
  jest?: JestConfig | ((jestConfig: JestConfig) => JestConfig);
}
