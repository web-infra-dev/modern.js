import path from 'path';
import { loadPlugins } from '../src/loadPlugins';

const modulePath = path.join(__dirname, './fixtures/load-plugins');
describe('test load plugin', () => {
  it('should load string plugin correctly', () => {
    const loaded = loadPlugins(modulePath, [], {
      internalPlugins: {
        'test-a': 'test-a',
      },
    });
    expect(loaded[0].name).toBe('test-a');
  });

  it('should load plugin instance correctly', () => {
    const loaded = loadPlugins(
      modulePath,
      [
        {
          name: 'modern',
        },
      ] as any,
      {},
    );

    expect(loaded[0].name).toBe('modern');
  });

  it('should throw error if plugin not found', () => {
    try {
      loadPlugins(modulePath, [], {
        internalPlugins: {
          'test-b': 'test-b',
        },
      });
    } catch (e: any) {
      expect(e.message).toMatch('Can not find module test-b.');
    }
  });
});
