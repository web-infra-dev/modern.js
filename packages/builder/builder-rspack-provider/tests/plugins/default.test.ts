import { expect, describe, it } from 'vitest';
import { createBuilder } from '../helper';

describe('applyDefaultPlugins', () => {
  it('should apply default plugins correctly', async () => {
    const builder = await createBuilder({});

    const {
      origin: { bundlerConfigs },
    } = await builder.inspectConfig();
    expect(bundlerConfigs[0]).toMatchSnapshot();
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
  });
});
