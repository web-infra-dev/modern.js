/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest';

const config: Config = {
  coverageProvider: 'babel',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(mjs|js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [],
};

export default config;
