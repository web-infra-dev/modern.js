import path from 'path';
import { manager, AppContext, CliPlugin } from '@modern-js/core';
import Chain from 'webpack-chain';
import { CHAIN_ID } from '@modern-js/utils';
import plugin from '../src/cli';
import './helper';

describe('bff cli plugin', () => {
  it('schema', async () => {
    const main = manager.clone().usePlugin(plugin as CliPlugin);
    const runner = await main.init();
    const result = await runner.validateSchema();

    expect(result).toMatchSnapshot();
  });

  it('config', async () => {
    const main = manager.clone().usePlugin(plugin as CliPlugin);
    const runner = await main.init();
    const result = await runner.config();

    expect(result).toMatchSnapshot();
  });

  it('config webpack chain', async () => {
    const main = manager.clone().usePlugin(plugin as CliPlugin);
    const runner = await main.init();
    const [{ tools }]: any = await runner.config();
    const chain = new Chain();
    AppContext.set({
      appDirectory: './fixtures/function',
      port: 3000,
    } as any);
    tools.webpackChain(chain, { CHAIN_ID });

    const config = chain.toConfig();
    expect(config.module?.rules?.[1]).toMatchObject({
      test: /.\/fixtures\/function\/api\/\.*(\.[tj]s)$/,
      use: [
        {
          loader: require.resolve('../src/loader.ts').replace(/\\/g, '/'),
          options: {
            existLambda: false,
            apiDir: path.resolve('./fixtures/function/api'),
            lambdaDir: path.resolve('./fixtures/function/api'),
            port: 3000,
            prefix: '/api',
          },
        },
      ],
    });

    expect(config.resolve).toMatchObject({
      alias: {
        '@api': path.resolve('./fixtures/function/api'),
      },
    });
  });
});
