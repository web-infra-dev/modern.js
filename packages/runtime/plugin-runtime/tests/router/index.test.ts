import { manager } from '@modern-js/core';
import plugin, { useHistory, useParams } from '../../src/plugins/router';
import cliPlugin from '../../src/plugins/router/cli';
import RuntimePlugin from '../../src/cli';

describe('plugin-router', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(useHistory).toBeDefined();
    expect(useParams).toBeDefined();
  });
});

describe('cli-router', () => {
  const main = manager.clone().usePlugin(RuntimePlugin, cliPlugin);
  let runner: any;

  beforeAll(async () => {
    runner = await main.init();
  });

  test('should plugin-router defined', async () => {
    expect(cliPlugin).toBeDefined();
  });

  it('plugin-router cli schema is defined', async () => {
    const result = await runner.validateSchema();
    expect(
      result.find((item: any) =>
        item.find(({ target }: any) => target === 'runtime.router'),
      ),
    ).toBeTruthy();
  });
});
