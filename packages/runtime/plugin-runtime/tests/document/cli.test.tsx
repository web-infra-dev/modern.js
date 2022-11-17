import { manager } from '@modern-js/core';
import plugin from '../../src/document/cli';

describe.only('plugin runtime cli', () => {
  const main = manager.clone().usePlugin(plugin);
  let runner: any;

  beforeAll(async () => {
    runner = await main.init();
  });

  it('plugin is defined', () => {
    expect(plugin).toBeDefined();
  });

  it('plugin-document cli config is defined', async () => {
    const config = await runner.config();
    expect(config.find((item: any) => item.tools)).toBeTruthy();
    expect(config.find((item: any) => item.tools.htmlPlugin)).toBeTruthy();
  });
});
