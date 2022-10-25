import path from 'path';
import { CliPlugin } from '../src';
import { isOldPluginConfig, loadPlugins } from '../src/loadPlugins';

describe('load plugins', () => {
  test('should get old plugin result correctly', () => {
    expect(isOldPluginConfig(['plugin-a'])).toBeTruthy();
    expect(isOldPluginConfig([['plugin-a', {}]])).toBeTruthy();
    expect(isOldPluginConfig({} as any)).toBeFalsy();
  });

  test('should load user plugin successfully', () => {
    const fixture = path.resolve(
      __dirname,
      './fixtures/load-plugin/user-plugins',
    );

    const plugins = loadPlugins(fixture, {
      plugins: [path.join(fixture, './test-plugin-a.js')],
    });
    expect(plugins[0].name).toBe('a');
  });

  test('should pass options to Plugin', () => {
    const fixture = path.resolve(
      __dirname,
      './fixtures/load-plugin/user-plugins',
    );

    const plugins = loadPlugins(fixture, {
      plugins: [
        ['./test-plugin-c', 'c'],
        ['./test-plugin-c', 'c2'],
      ],
    });

    expect(plugins[0].name).toEqual('c');
    expect(plugins[1].name).toEqual('c2');
  });

  test(`should throw error when plugin not found `, () => {
    const fixture = path.resolve(__dirname, './fixtures/load-plugin/not-found');

    expect(() => {
      loadPlugins(fixture, {
        plugins: ['./test-plugin-a', './plugin-b'],
      });
    }).toThrowError(/^Can not find module /);
  });

  test(`should load new plugin array correctly`, () => {
    const appDirectory = path.resolve(
      __dirname,
      './fixtures/load-plugin/user-plugins',
    );
    const plugin = (): CliPlugin => ({
      name: 'foo',
    });
    const userConfig = { plugins: [plugin()] };
    const loadedPlugins = loadPlugins(appDirectory, userConfig);

    expect(loadedPlugins[0]?.name).toEqual('foo');
  });

  test(`should load new plugin object correctly`, () => {
    const appDirectory = path.resolve(
      __dirname,
      './fixtures/load-plugin/user-plugins',
    );
    const plugin = (): CliPlugin => ({
      name: 'foo',
    });
    const userConfig = { plugins: [plugin()] };
    const loadedPlugins = loadPlugins(appDirectory, userConfig);

    expect(loadedPlugins[0]?.name).toEqual('foo');
  });

  test('should call transformPlugin', () => {
    const fixture = path.resolve(
      __dirname,
      './fixtures/load-plugin/user-plugins',
    );

    const options = {
      transformPlugin: jest.fn(),
    };
    options.transformPlugin.mockImplementation((plugins, _) => plugins);

    loadPlugins(
      fixture,
      { plugins: [path.join(fixture, './test-plugin-a.js')] },
      options,
    );

    expect(options.transformPlugin).toHaveBeenCalled();
  });
});
