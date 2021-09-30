import path from 'path';
import { manager, AppContext } from '@modern-js/core';
import { modifyServerRoutes } from '@modern-js/plugin-analyze';
import Chain from 'webpack-chain';
import plugin from '../src/cli';

const root = path.resolve(__dirname, '../../../../');
expect.addSnapshotSerializer({
  test: val => typeof val === 'string' && val.includes('modern-js'),
  print: val =>
    typeof val === 'string'
      ? `"${val.replace(root, '').replace(root.replace('/', '\\//'), '')}"`
      : (val as string),
});

describe('bff cli plugin', () => {
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

  it('config webpack chain', async () => {
    const main = manager.clone().usePlugin(plugin);
    const runner = await main.init();
    const [{ tools }]: any = await runner.config();
    const chain = new Chain();
    manager.run(() => {
      AppContext.set({
        appDirectory: './fixtures/function',
        port: 3000,
      } as any);
    });
    manager.run(() => tools.webpack({}, { chain }));

    expect(chain.toConfig()).toMatchSnapshot();
  });

  it('server routes', async () => {
    const main = manager.clone().usePlugin(plugin);
    main.registe({ modifyServerRoutes });
    const runner = await main.init();
    const result = await runner.modifyServerRoutes({ routes: [] });

    expect(result).toMatchSnapshot();
  });
});
