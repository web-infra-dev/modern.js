import { manager } from '@modern-js/core';
import RuntimePlugin from '@modern-js/runtime/cli';
import plugin, { useHistory, useParams } from '../src';
import cliPlugin from '../src/cli';

describe('plugin-router-legacy', () => {
  it('default', () => {
    expect(plugin).toBeDefined();
    expect(useHistory).toBeDefined();
    expect(useParams).toBeDefined();
  });
});

describe('cli-router-legacy', () => {
  const main = manager.clone().usePlugin(RuntimePlugin, cliPlugin as any);
  let runner: any;

  beforeAll(async () => {
    runner = await main.init();
  });

  test('should plugin-router-legacy defined', async () => {
    expect(cliPlugin).toBeDefined();
  });

  it('plugin-router-legacy cli config is defined', async () => {
    const config = await runner.config();
    expect(
      config.find(
        (item: any) => item.source.alias['@modern-js/runtime/plugins'],
      ),
    ).toBeTruthy();
  });

  it('plugin-router-legacy cli schema is defined', async () => {
    const result = await runner.validateSchema();
    expect(
      result.find((item: any) =>
        item.find(({ target }: any) => target === 'runtime.router'),
      ),
    ).toBeTruthy();
  });
});
