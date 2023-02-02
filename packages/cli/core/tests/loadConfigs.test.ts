import path from 'path';
import {
  loadConfig,
  getDependencies,
  getConfigFilePath,
} from '../src/config/loadConfig';

// globby needs setImmediate
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
global.setImmediate = setTimeout;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
global.clearImmediate = clearTimeout;

describe('load user config file', () => {
  jest.disableAutomock();

  test(`should support ts config file`, async () => {
    const fixturePath = path.resolve(__dirname, './fixtures/config/ts');

    const userConfig = await loadConfig<any>(
      fixturePath,
      getConfigFilePath(fixturePath),
    );

    expect(userConfig).not.toBe(null);

    const { path: configFile, config, pkgConfig } = userConfig;

    expect(config).toHaveProperty('runtime.features.state', true);

    expect(configFile).toEqual(path.join(fixturePath, 'modern.config.ts'));

    expect(pkgConfig).toBeUndefined();
  });

  test(`should support cjs config file`, async () => {
    const fixturePath = path.resolve(__dirname, './fixtures/config/cjs');

    const userConfig = await loadConfig<any>(
      fixturePath,
      getConfigFilePath(fixturePath),
    );

    const { config } = userConfig;

    expect(config).not.toBe(null);

    expect(config).toHaveProperty('runtime.features.state', false);
  });

  test(`should support es6+ syntax`, async () => {
    const fixturePath = path.resolve(__dirname, './fixtures/config/es');

    const userConfig = await loadConfig<any>(
      fixturePath,
      getConfigFilePath(fixturePath),
    );

    const { config, pkgConfig } = userConfig;

    expect(config).not.toBe(null);

    expect(config).toHaveProperty('source.entries.app', './src/App.jsx');

    expect(pkgConfig).toEqual({ a: 'b' });
  });

  test(`should support specify config file`, async () => {
    const fixturePath = path.resolve(__dirname, './fixtures/config/file-param');

    const userConfig = await loadConfig<any>(
      path.join(fixturePath),
      path.join(fixturePath, 'a.config.js'),
    );

    const { config } = userConfig;

    expect(config).not.toBe(null);

    expect(config).toHaveProperty('output.polyfill', 'off');
  });

  test(`should support specify package.json config property name`, async () => {
    const fixturePath = path.resolve(__dirname, './fixtures/config/file-param');
    const customUserConfig = await loadConfig<any>(
      fixturePath,
      getConfigFilePath(fixturePath),
      'aConfig',
    );
    const { pkgConfig: customPkgConfig } = customUserConfig;

    expect(customPkgConfig).toBeTruthy();

    expect(customPkgConfig).toHaveProperty('hasAConfig');
    expect(customPkgConfig).not.toHaveProperty('hasModernConfig');

    const defaultUserConfig = await loadConfig<any>(
      fixturePath,
      getConfigFilePath(fixturePath),
    );
    const { pkgConfig: defaultPkgConfig } = defaultUserConfig;

    expect(defaultPkgConfig).toBeTruthy();
    expect(defaultPkgConfig).toHaveProperty('hasModernConfig');
    expect(defaultPkgConfig).not.toHaveProperty('hasAConfig');
  });

  test(`have no config file found`, async () => {
    const fixturePath = path.resolve(__dirname, './fixtures/config/no-config');

    const userConfig = await loadConfig<any>(
      fixturePath,
      getConfigFilePath(fixturePath),
    );

    expect(userConfig.path).toBe(false);
    expect(userConfig.config).toBeUndefined();
  });
});

describe('get file dependencies', () => {
  const file = path.resolve(__dirname, './fixtures/deps/a.js');

  test(`should return empty array`, () => {
    // delete cache manually
    jest.resetModules();

    const deps = getDependencies(file);

    expect(deps).toEqual([]);
  });
});

describe('get config path', () => {
  test('should support relative filepath', () => {
    expect(getConfigFilePath('/root', './config.js')).toEqual(
      path.resolve('/root', './config.js'),
    );
  });

  test('should support absolute filepath', () => {
    expect(getConfigFilePath('/root', '/foo/config.js')).toEqual(
      '/foo/config.js',
    );
  });
});
