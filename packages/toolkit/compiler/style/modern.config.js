/** @type {import('@modern-js/module-tools').UserConfig} */
module.exports = {
  testing: {
    jest: {
      testEnvironment: 'node',
      collectCoverage: true,
      collectCoverageFrom: ['./src/**/*.ts'],
      coveragePathIgnorePatterns: ['/node_modules/', '/tests'],
    },
  },
};
