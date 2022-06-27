import path from 'path';
import { loadPlugins } from '../src/loadPlugins';

const modulePath = path.join(__dirname, './fixtures/load-plugins');
describe('test load plugin', () => {
  it('should load string plugin correctly', () => {
    const loaded = loadPlugins(['test-a'], modulePath);
    expect(loaded[0].pluginPath).toBe(
      path.join(__dirname, './fixtures/load-plugins/test-a/index.js'),
    );
  });

  it('should load plugin instance correctly', () => {
    const loaded = loadPlugins(
      [
        {
          name: 'modern',
        },
      ],
      modulePath,
    );

    expect(loaded[0].name).toBe('modern');
  });

  it('should throw error if plugin not found', () => {
    try {
      loadPlugins(['test-b'], modulePath);
    } catch (e: any) {
      expect(e.message).toMatch('Can not find module test-b.');
    }
  });
});
