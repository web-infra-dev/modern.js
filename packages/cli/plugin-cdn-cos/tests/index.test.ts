import { manager } from '@modern-js/core';
import plugin from '../src';

describe('plugin-cdn-cos', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
  });

  it('should usePlugin without error', async () => {
    const main = manager.clone().usePlugin(plugin);
    const runner = await main.init();
    expect(runner).toBeDefined();
  });
});
