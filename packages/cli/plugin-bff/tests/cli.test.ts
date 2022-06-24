import path from 'path';
import { manager, AppContext } from '@modern-js/core';
import { modifyServerRoutes } from '@modern-js/plugin-analyze';
import Chain from 'webpack-chain';
import { CHAIN_ID } from '@modern-js/utils';
import plugin from '../src/cli';
import './helper';

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
    AppContext.set({
      appDirectory: './fixtures/function',
      port: 3000,
    } as any);
    tools.webpackChain(chain, { CHAIN_ID });

    expect(chain.toConfig()).toMatchObject({
      module: {
        rules: [
          {
            oneOf: [
              {
                test: /.\/fixtures\/function\/api\/\.*(\.[tj]s)$/,
                use: [
                  {
                    loader: require
                      .resolve('../src/loader.ts')
                      .replace(/\\/g, '/'),
                    options: {
                      apiDir: path.resolve('./fixtures/function/api'),
                      fetcher: undefined,
                      port: 3000,
                      prefix: '/api',
                      target: undefined,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      resolve: {
        alias: {
          '@api': path.resolve('./fixtures/function/api'),
        },
      },
    });
  });

  it('server routes', async () => {
    const main = manager.clone().usePlugin(plugin);
    main.registerHook({ modifyServerRoutes });
    const runner = await main.init();
    const result = await runner.modifyServerRoutes({ routes: [] });

    expect(result).toMatchSnapshot();
  });
});
