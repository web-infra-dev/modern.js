/** @type {import('@modern-js/module-tools').UserConfig} */
module.exports = {
  testing: {
    jest: {
      collectCoverage: true,
      collectCoverageFrom: ['./src/**/*.ts'],
      coveragePathIgnorePatterns: ['/node_modules/'],
      testEnvironment: 'jsdom',
      moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
      transform: {
        '^.+\\.tsx?$': 'ts-jest',
      },
    },
  },
};
