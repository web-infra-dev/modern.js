import { expect, describe, it } from 'vitest';
import { initPlugins, createPluginStore } from '../src';

describe('initPlugins', () => {
  it('should sort plugin correctly', async () => {
    const pluginStore = createPluginStore();
    const result: number[] = [];

    pluginStore.addPlugins([
      {
        name: 'plugin0',
        setup() {
          result.push(0);
        },
      },
      {
        name: 'plugin1',
        pre: ['plugin3'],
        setup() {
          result.push(1);
        },
      },
      {
        name: 'plugin2',
        post: ['plugin0'],
        setup() {
          result.push(2);
        },
      },
      {
        name: 'plugin3',
        setup() {
          result.push(3);
        },
      },
    ]);

    await initPlugins({ pluginStore });

    expect(result).toEqual([2, 0, 3, 1]);
  });

  it('should allow to remove plugin', async () => {
    const pluginStore = createPluginStore();
    const result: number[] = [];

    pluginStore.addPlugins([
      {
        name: 'plugin0',
        setup() {
          result.push(0);
        },
      },
      {
        name: 'plugin1',
        setup() {
          result.push(1);
        },
      },
      {
        name: 'plugin2',
        remove: ['plugin1'],
        setup() {
          result.push(2);
        },
      },
    ]);

    await initPlugins({ pluginStore });

    expect(result).toEqual([0, 2]);
  });
});
