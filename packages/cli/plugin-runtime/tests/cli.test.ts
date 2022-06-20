import { manager } from '@modern-js/core';
import plugin from '../src/cli';

describe('plugin runtime cli', () => {
  const main = manager.clone().usePlugin(plugin);
  let runner: any;

  beforeAll(async () => {
    runner = await main.init();
  });

  it('plugin is defined', () => {
    expect(plugin).toBeDefined();
  });

  it('plugin config', async () => {
    const config = await runner.config();
    expect(config).not.toBe(null);
  });

  it('schema', async () => {
    const schema = await runner.validateSchema();
    expect(schema).not.toBe(null);
  });
});
