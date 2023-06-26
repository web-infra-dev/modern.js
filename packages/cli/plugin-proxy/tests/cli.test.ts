import { manager } from '@modern-js/core';
import plugin from '../src';

describe('plugin proxy test', () => {
  it('schema', async () => {
    const main = manager.clone().usePlugin(plugin);
    const runner = await main.init();
    const result = await runner.validateSchema();

    expect(result).toMatchSnapshot();
  });

  it('config', async () => {
    const main = manager.clone().usePlugin(plugin);
    const runner = await main.init();
    const result = await runner.config();
    expect(result).toMatchSnapshot();
  });
});
