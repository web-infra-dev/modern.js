import { expect, describe, it } from 'vitest';
import { createBuilder } from '../helper';
import { BuilderPlugin } from '@/types';

describe('applyDefaultPlugins', () => {
  it('should apply default plugins correctly', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';
    const builder = await createBuilder({});

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });

  it('should apply default plugins correctly when prod', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'production';

    const builder = await createBuilder({});

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });
});

describe('tools.rspack', () => {
  it('should match snapshot', async () => {
    const { NODE_ENV } = process.env;
    process.env.NODE_ENV = 'development';

    class TestPlugin {
      readonly name: string = 'TestPlugin';

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      apply() {}
    }

    const builder = await createBuilder({
      builderConfig: {
        tools: {
          rspack: (config, { addRules, prependPlugins }) => {
            addRules({
              test: /\.test$/,
              use: [
                {
                  builtinLoader: 'sass-loader',
                },
              ],
            });
            prependPlugins([new TestPlugin()]);
          },
        },
      },
    });
    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();

    expect(bundlerConfigs[0]).toMatchSnapshot();

    process.env.NODE_ENV = NODE_ENV;
  });
});

describe('bundlerApi', () => {
  it('test modifyBundlerChain and api order', async () => {
    const testPlugin: BuilderPlugin = {
      name: 'builder-plugin-devtool',
      setup: api => {
        api.modifyBundlerChain(chain => {
          chain.target('node');
          chain.devtool('cheap-module-source-map');
        });

        api.modifyRspackConfig(config => {
          config.devtool = 'hidden-source-map';
        });
      },
    };

    const builder = await createBuilder({
      plugins: [testPlugin],
    });

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchInlineSnapshot(`
      {
        "devtool": "hidden-source-map",
        "module": {},
        "target": "node",
      }
    `);
  });
});
