import { describe, it, expect } from 'vitest';
import { createUniBuilder } from '../src';

describe('uni-builder legacy plugins', () => {
  it('legacy plugin should works well', async () => {
    const rsbuild = await createUniBuilder({
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

            expect(api.context.target).toBe(api.context.targets);

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
