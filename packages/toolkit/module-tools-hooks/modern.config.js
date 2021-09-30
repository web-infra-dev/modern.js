/** @type {import('@modern-js/module-tools').UserConfig} */
module.exports = {
  testing: {
    jest: {
      testMatch: ['**/src/__tests__/*.test.ts'],
      collectCoverage: true,
      collectCoverageFrom: ['./src/**/*.ts'],
      coveragePathIgnorePatterns: ['/node_modules/', '/src/__tests__/'],
    },
  },
};
