/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.[jt]s?(x)'],
  coveragePathIgnorePatterns: ['/node_modules/', '/fixtures/'],
  transform: {
    '\\.[jt]sx?$': [
      require.resolve('@swc/jest'),
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
      },
    ],
  },
  transformIgnorePatterns: [
    '/node_modules/.pnpm/(?!(@modern-js-reduck|@babel))',
  ],
  moduleNameMapper: {},
  globals: {},
  testEnvironment: require.resolve('../../tests/jest.env.js'),
  resolver: require.resolve('../../tests/jest.resolver.js'),
  rootDir: __dirname,
  testTimeout: 30000,
  testMatch: [
    '<rootDir>/src/**/*.test.[jt]s?(x)',
    '<rootDir>/tests/**/*.test.[jt]s?(x)',
  ],
  modulePathIgnorePatterns: [],
};
