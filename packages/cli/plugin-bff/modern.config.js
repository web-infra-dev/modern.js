/** @type {import('@modern/module-tools').UserConfig} */
module.exports = {
  testing: {
    jest: {
      collectCoverage: true,
      collectCoverageFrom: ['src/**/*.ts'],
      coveragePathIgnorePatterns: ['/node_modules/'],
    },
  },
};
