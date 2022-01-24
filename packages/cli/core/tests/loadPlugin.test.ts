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

    const plugins = loadPlugins(fixture, [
      { cli: path.join(fixture, './test-plugin-a.js') },
      { server: './test-plugin-b' },
    ]);

    expect(plugins).toEqual([
      {
        cli: {
          name: 'a',
          pluginPath: path.join(fixture, './test-plugin-a.js'),
        },
        cliPath: path.join(fixture, './test-plugin-a.js'),
      },
      {
        server: {
          name: 'b',
          pluginPath: path.join(fixture, './test-plugin-b.js'),
        },
        serverPath: './test-plugin-b',
      },
    ]);
  });

  test('should load user string plugin successfully', () => {
    const fixture = path.resolve(
      __dirname,
      './fixtures/load-plugin/user-plugins',
    );

    const plugins = loadPlugins(fixture, [
      path.join(fixture, './test-plugin-a.js') as any,
    ]);

    expect(plugins).toEqual([
      {
        cli: {
          name: 'a',
          pluginPath: path.join(fixture, './test-plugin-a.js'),
        },
        cliPath: path.join(fixture, './test-plugin-a.js'),
      },
    ]);
  });

  test(`should throw error when plugin not found `, () => {
    const fixture = path.resolve(__dirname, './fixtures/load-plugin/not-found');

    expect(() => {
      loadPlugins(fixture, [{ cli: './test-plugin-a' }, { cli: './plugin-b' }]);
    }).toThrowError(/^Can not find plugin /);
  });
});
