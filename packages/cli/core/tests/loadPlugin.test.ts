import path from 'path';
import { loadPlugins } from '@/loadPlugins';

describe('load plugins', () => {
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
      { cli: { name: 'a' } },
      { server: { name: 'b' } },
    ]);
  });

  test(`should throw error when plugin not found `, () => {
    const fixture = path.resolve(__dirname, './fixtures/load-plugin/not-found');

    expect(() => {
      loadPlugins(fixture, [{ cli: './test-plugin-a' }, { cli: './plugin-b' }]);
    }).toThrowError(/^Can not find plugin /);
  });
});
