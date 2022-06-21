jest.mock('@modern-js/core', () => ({
  manager: {
    run: async (fn: any) => {
      await fn();
    },
  },
  cli: {
    init: () => ({}),
  },
}));
jest.mock('process.argv', () => () => (o: any) => ({ ...o, tsCheck: false }));
jest.mock('../src/features/build/bundleless/generator-dts/utils');
jest.mock('@modern-js/utils', () => {
  const originalModule = jest.requireActual('@modern-js/utils');
  return {
    __esModule: true, // Use it when dealing with esModules
    ...originalModule,
    fs: {
      ...originalModule.fs,
      removeSync: jest.fn(),
    },
  };
});
process.argv = [];

describe('generator dts test', () => {
  it('test tsCheck is true', () => {
    console.info = jest.fn(str => {
      expect(str).toBe(
        "There are some type warnings, which can be checked by configuring 'output.disableTsChecker = false'",
      );
    });
    require('../src/features/build/bundleless/generator-dts');
  });
});

export {};
