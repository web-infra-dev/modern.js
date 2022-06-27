import path from 'path';
import { CliPlugin } from '../src';
import { loadPlugins, getAppPlugins } from '../src/loadPlugins';

describe('load plugins', () => {
  test('getAppPlugins', () => {
    const appDirectory = path.resolve(
      __dirname,
      './fixtures/load-plugin/user-plugins',
    );
    const plugins = getAppPlugins(appDirectory, ['foo' as any], {
      x: {
        cli: 'x',
        forced: true,
      } as any,
    });
    expect(plugins).toEqual([{ cli: 'x', forced: true }, 'foo']);
  });

  test('should load user plugin successfully', () => {
    const fixture = path.resolve(
      __dirname,
      './fixtures/load-plugin/user-plugins',
    );

    const plugins = loadPlugins(fixture, {
      plugins: [
        { cli: path.join(fixture, './test-plugin-a.js') },
        { server: './test-plugin-b' },
      ],
    });

    expect(plugins).toEqual([
      {
        cli: {
          name: 'a',
        },
      },
      {
        server: './test-plugin-b',
        serverPkg: './test-plugin-b',
      },
    ]);
  });

  test('should pass options to Plugin', () => {
    const fixture = path.resolve(
      __dirname,
      './fixtures/load-plugin/user-plugins',
    );

    const plugins = loadPlugins(fixture, {
      plugins: [{ cli: ['./test-plugin-c', 'c'] }, ['./test-plugin-c', 'c2']],
    });

    expect(plugins[0].cli!.name).toEqual('c');
    expect(plugins[1].cli!.name).toEqual('c2');
  });

  test('should load user string plugin successfully', () => {
    const fixture = path.resolve(
      __dirname,
      './fixtures/load-plugin/user-plugins',
    );

    const plugins = loadPlugins(fixture, {
      plugins: [path.join(fixture, './test-plugin-a.js') as any],
    });

    expect(plugins).toEqual([
      {
        cli: {
          name: 'a',
        },
      },
    ]);
  });

  test(`should throw error when plugin not found `, () => {
    const fixture = path.resolve(__dirname, './fixtures/load-plugin/not-found');

    expect(() => {
      loadPlugins(fixture, {
        plugins: [{ cli: './test-plugin-a' }, { cli: './plugin-b' }],
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

    expect(loadedPlugins[0].cli?.name).toEqual('foo');
  });

  test(`should load new plugin object correctly`, () => {
    const appDirectory = path.resolve(
      __dirname,
      './fixtures/load-plugin/user-plugins',
    );
    const plugin = (): CliPlugin => ({
      name: 'foo',
    });
    const userConfig = { plugins: { cli: [plugin()] } };
    const loadedPlugins = loadPlugins(appDirectory, userConfig);

    expect(loadedPlugins[0].cli?.name).toEqual('foo');
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
      { plugins: [{ cli: path.join(fixture, './test-plugin-a.js') }] },
      options,
    );

    expect(options.transformPlugin).toHaveBeenCalled();
  });
});
