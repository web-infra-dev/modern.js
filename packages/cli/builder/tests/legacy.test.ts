import { describe, expect, it } from 'vitest';
import { createBuilder } from '../src';

describe('builder legacy plugins', () => {
  it('legacy plugin should works well', async () => {
    const rsbuild = await createBuilder({
      bundlerType: 'rspack',
      config: {},
      cwd: '',
    });

    rsbuild.addPlugins([
      {
        name: 'builder-plugin-test',
        setup: api => {
          api.modifyBuilderConfig((config, { mergeBuilderConfig }) => {
            const builderConfig = api.getBuilderConfig();

            expect(builderConfig.source).toBeDefined();

            return mergeBuilderConfig(config, {
              tools: {
                bundlerChain: (chain: any) => {
                  chain.devtool(false);
                },
              },
            });
          });
        },
      },
    ]);

    const {
      origin: { bundlerConfigs },
    } = await rsbuild.inspectConfig();

    expect(bundlerConfigs[0].devtool).toBeFalsy();
  });
});
