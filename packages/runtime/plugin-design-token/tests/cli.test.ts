import { manager } from '@modern-js/core';
import plugin from '../src/cli';

describe('plugin design token test', () => {
  it('schema', async () => {
    const main = manager.clone().usePlugin(plugin);
    const runner = await main.init();
    const result = await runner.validateSchema();

    expect(result).not.toBeNull();
  });

  it('config', async () => {
    const main = manager.clone().usePlugin(plugin);
    const runner = await main.init();
    const result = await runner.config();

    expect(result).not.toBeNull();
  });
});
