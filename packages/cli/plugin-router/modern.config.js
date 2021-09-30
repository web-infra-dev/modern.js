/** @type {import('@modern-js/module-tools').UserConfig} */
module.exports = {
  output: {
    disableSourceMap: true,
  },
  testing: {
    jest: {
      collectCoverage: true,
      collectCoverageFrom: ['./src/**/*.ts', './src/**/*.tsx'],
      coveragePathIgnorePatterns: ['/node_modules/', '/src/__tests__/'],
      testEnvironment: 'jsdom',
    },
  },
};
