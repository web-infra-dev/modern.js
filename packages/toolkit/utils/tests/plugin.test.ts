import path from 'path';
import { getInternalPlugins } from '../src';

const fixture = path.resolve(__dirname, './fixtures/plugin');

describe('plugin', () => {
  test('should get internal plugin correctly if dependence', () => {
    const plugins = getInternalPlugins(fixture, {
      'plugin-a': 'plugin-a',
    });
    expect(plugins[0]).toBe('plugin-a');
  });

  test('should not get internal plugin correctly if not dependence', () => {
    const plugins = getInternalPlugins(fixture, {
      'plugin-b': 'plugin-b',
    });
    expect(plugins.length).toBe(0);
  });

  test('should get internal plugin always if forced', () => {
    const b = {
      path: 'plugin-b',
      forced: true,
    };
    const plugins = getInternalPlugins(fixture, {
      'plugin-b': b,
    });
    expect(plugins.length).toBe(1);
    expect(plugins[0]).toEqual(b.path);
  });
});
