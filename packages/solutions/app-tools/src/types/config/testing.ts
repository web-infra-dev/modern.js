import type { TestConfig } from '@modern-js/types';

export interface TestingUserConfig {
  /**
   * Decide which transformer will be used to compile file
   * Default: babel-jest
   */
  transformer?: TestConfig['transformer'];
}
