import path from 'path';
import { loadConfig, getDependencies } from '../src';

describe('load user config file', () => {
  jest.disableAutomock();

  test(`should support ts config file`, async () => {
    const fixturePath = path.resolve(__dirname, './fixtures/config/ts');

    const userConfig = await loadConfig<any>(path.join(fixturePath));

    expect(userConfig).not.toBe(null);

    const { path: configFile, config, pkgConfig } = userConfig;

    expect(config).toHaveProperty('runtime.features.state', true);

    expect(configFile).toEqual(path.join(fixturePath, 'modern.config.ts'));

    expect(pkgConfig).toBeUndefined();
  });

  test(`should support cjs config file`, async () => {
    const fixturePath = path.resolve(__dirname, './fixtures/config/cjs');

    const userConfig = await loadConfig<any>(path.join(fixturePath));

    const { config } = userConfig;

    expect(config).not.toBe(null);

    expect(config).toHaveProperty('runtime.features.state', false);
  });

  test(`should support es6+ syntax`, async () => {
    const fixturePath = path.resolve(__dirname, './fixtures/config/es');

    const userConfig = await loadConfig<any>(path.join(fixturePath));

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

  test(`have no config file found`, async () => {
    const fixturePath = path.resolve(__dirname, './fixtures/config/no-config');

    const userConfig = await loadConfig<any>(path.join(fixturePath));

    expect(userConfig.path).toBe(false);
    expect(userConfig.config).toBeUndefined();
  });
});

describe('get file dependencies', () => {
  const file = path.resolve(__dirname, './fixtures/deps/a.js');

  // TODO: jest module.children is empty array
  // test(`should return file dependencies`, () => {
  //   // ensure require.cache
  //   require(file);

  //   const deps = getDependencies(file);

  //   expect(deps).toEqual(
  //     ['a.js'].map(name => path.join(__dirname, './fixtures/deps', name)),
  //   );
  // });

  test(`should return empty array`, () => {
    // delete cache manually
    jest.resetModules();

    const deps = getDependencies(file);

    expect(deps).toEqual([]);
  });
});
