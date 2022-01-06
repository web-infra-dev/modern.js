import path from 'path';
import { manager, AppContext } from '@modern-js/core';
import { modifyServerRoutes } from '@modern-js/plugin-analyze';
import Chain from 'webpack-chain';
import plugin from '../src/cli';

const root = path.normalize(path.resolve(__dirname, '../../../../'));
expect.addSnapshotSerializer({
  test: val =>
    typeof val === 'string' &&
    (val.includes('modern.js') ||
      val.includes('node_modules') ||
      val.includes(root)),
  print: val =>
    // eslint-disable-next-line no-nested-ternary
    typeof val === 'string'
      ? // eslint-disable-next-line no-nested-ternary
        val.includes('node_modules')
        ? `"${val.replace(/.+node_modules/, '')}"`
        : val.includes('modern.js')
        ? `"${val.replace(/.+modern\.js/, '')}"`
        : `"${val.replace(root, '')}"`
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
    main.registe({ modifyServerRoutes });
    const runner = await main.init();
    const result = await runner.modifyServerRoutes({ routes: [] });

    expect(result).toMatchSnapshot();
  });
});
