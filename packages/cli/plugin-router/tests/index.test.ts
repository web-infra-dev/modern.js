import { manager } from '@modern-js/core';
import plugin, { useHistory, useParams } from '../src';
import cliPlugin from '../src/cli';
import RuntimePlugin from '../../plugin-runtime/src/cli';

describe('plugin-router', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(useHistory).toBeDefined();
    expect(useParams).toBeDefined();
  });
});

describe('cli-router', () => {
  const main = manager.clone().usePlugin(RuntimePlugin).usePlugin(cliPlugin);
  let runner: any;

  beforeAll(async () => {
    runner = await main.init();
  });

  test('should plugin-router defined', async () => {
    expect(cliPlugin).toBeDefined();
  });

  it('plugin-router cli config snapshot', async () => {
    const config = await runner.config();
    expect(config[0]).toMatchSnapshot({
      source: {
        alias: expect.any(Object),
      },
    });
  });

  it('plugin-router cli schema snapshot', async () => {
    const schema = await runner.validateSchema();
    expect(schema).toMatchSnapshot();
  });
});
