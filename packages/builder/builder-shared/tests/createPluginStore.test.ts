import { expect, describe, it } from 'vitest';
import { createPluginStore } from '../src/createPluginStore';

describe('createPluginStore', () => {
  it('addPlugins and removePlugins works', () => {
    const pluginStore = createPluginStore();
    expect(pluginStore.plugins).toEqual([]);
    pluginStore.addPlugins([
      {
        name: 'foo',
        setup() {
          /* do nothing */
        },
      },
      {
        name: 'bar',
        setup() {
          /* do nothing */
        },
      },
    ]);
    expect(pluginStore.plugins).toHaveLength(2);
    pluginStore.removePlugins(['foo']);
    expect(pluginStore.plugins).toHaveLength(1);
    expect(pluginStore.isPluginExists('foo')).toBe(false);
  });
});
