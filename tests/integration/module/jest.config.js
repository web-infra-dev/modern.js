const sharedConfig = require('@scripts/jest-config');

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...sharedConfig,
  rootDir: __dirname,
  testEnvironment: '../../jest.env.js',
  testMatch: ['<rootDir>/src/**/*.test.[jt]s?(x)'],
  collectCoverage: false,
};
