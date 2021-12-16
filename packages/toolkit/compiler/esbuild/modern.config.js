/** @type {import('@modern-js/module-tools').UserConfig} */
module.exports = {
  testing: {
    jest: {
      // Reasons for setting up testRunner:
      // https://github.com/facebook/jest/issues/10529
      // https://jestjs.io/blog/2020/05/05/jest-26
      testEnvironment: 'node',
      collectCoverage: true,
      collectCoverageFrom: ['./src/**/*.ts'],
      coveragePathIgnorePatterns: ['/node_modules/', '/tests'],
    },
  },
};
