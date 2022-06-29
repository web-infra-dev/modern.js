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

  it('plugin-runtime cli config snapshot', async () => {
    const config = await runner.config();
    expect(config[0]).toMatchSnapshot({
      source: {
        alias: expect.any(Object),
      },
    });
  });

  it('plugin-runtime cli schema snapshot', async () => {
    const schema = await runner.validateSchema();
    expect(schema).toMatchSnapshot();
  });
});
