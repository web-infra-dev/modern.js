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

  it('cli config', async () => {
    const config = await runner.config();
    expect(config).not.toBe(null);
  });

  it('cli schema', async () => {
    const schema = await runner.validateSchema();
    expect(schema).not.toBe(null);
  });
});
