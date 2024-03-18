import path from 'path';
import { loadPlugins } from '../../src/core/loadPlugins';

const modulePath = path.join(__dirname, './fixtures/load-plugins');
describe('test load plugin', () => {
  it('should load string plugin correctly', () => {
    const loaded = loadPlugins(modulePath, {
      'test-a': 'test-a',
    });
    expect(loaded[0].name).toBe('test-a');
  });

  it('should throw error if plugin not found', () => {
    try {
      loadPlugins(modulePath, {
        'test-b': 'test-b',
      });
    } catch (e: any) {
      expect(e.message).toMatch('Can not find module test-b.');
    }
  });
});
