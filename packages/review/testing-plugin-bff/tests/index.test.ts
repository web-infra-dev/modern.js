import path from 'path';
import createPlugin, { setJestConfigForBFF } from '../src';

const root = path.resolve(__dirname, '../../../../');
expect.addSnapshotSerializer({
  test: val => typeof val === 'string' && val.includes(root),
  print: val =>
    typeof val === 'string'
      ? `"${val.replace(root, '').replace(/\\/g, '/')}"`
      : (val as string),
});

describe('testing-plugin-bff', () => {
  const appDir = path.normalize(path.resolve(__dirname, './fixtures/bff1'));
  const mockUtils = {
    _jestConfig: {},
    get jestConfig() {
      return this._jestConfig;
    },
    setJestConfig(config: any, options: { force?: boolean } = {}) {
      if (options.force) {
        this._jestConfig = config;
      }
      this._jestConfig = Object.assign(this._jestConfig, config);
    },
  };

  test('plugin', async () => {
    expect(createPlugin).toBeDefined();
    expect(createPlugin).toBeInstanceOf(Function);
  });

  test('setJestConfigForBFF', async () => {
    await setJestConfigForBFF({
      pwd: appDir,
      userConfig: {},
      plugins: [],
      routes: [],
      utils: mockUtils,
    });

    expect(mockUtils.jestConfig).toMatchSnapshot();
  });

  test('testTimeout should not set in projects', async () => {
    mockUtils.setJestConfig({
      testTimeout: 1000,
    });
    await setJestConfigForBFF({
      pwd: appDir,
      userConfig: {},
      plugins: [],
      routes: [],
      utils: mockUtils,
    });

    expect(mockUtils.jestConfig).toMatchSnapshot();
  });
});
