import path from 'path';
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
          pluginPath: path.join(fixture, './test-plugin-a.js'),
        },
        cliPkg: path.join(fixture, './test-plugin-a.js'),
      },
      {
        server: {
          pluginPath: path.join(fixture, './test-plugin-b.js'),
        },
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

    expect(plugins).toEqual([
      {
        cli: {
          name: 'c',
          pluginPath: path.join(fixture, './test-plugin-c.js'),
        },
        cliPkg: './test-plugin-c',
      },
      {
        cli: {
          name: 'c2',
          pluginPath: path.join(fixture, './test-plugin-c.js'),
        },
        cliPkg: './test-plugin-c',
      },
    ]);
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
          pluginPath: path.join(fixture, './test-plugin-a.js'),
        },
        cliPkg: path.join(fixture, './test-plugin-a.js'),
      },
    ]);
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

  test(`should throw error when plugin not found `, () => {
    const fixture = path.resolve(__dirname, './fixtures/load-plugin/not-found');

    expect(() => {
      loadPlugins(fixture, {
        plugins: [{ cli: './test-plugin-a' }, { cli: './plugin-b' }],
      });
    }).toThrowError(/^Can not find plugin /);
  });
});
