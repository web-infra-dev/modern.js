import type { BuilderPlugin } from '@modern-js/builder';
import { isUseCssSourceMap } from '@modern-js/builder-shared';
import type { BuilderPluginAPI } from '@modern-js/builder-webpack-provider';

type StylusOptions = {
  use?: string[];
  include?: string;
  import?: string;
  resolveURL?: boolean;
  lineNumbers?: boolean;
  hoistAtrules?: boolean;
};

type StylusLoaderOptions = {
  stylusOptions?: StylusOptions;
  sourceMap?: boolean;
};

export type PluginStylusOptions = StylusLoaderOptions;

export function builderPluginStylus(
  options?: PluginStylusOptions,
): BuilderPlugin<BuilderPluginAPI> {
  return {
    name: 'builder-plugin-stylus',

    async setup(api) {
      const { bundlerType } = api.context;
      api.modifyBundlerChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { STYLUS_REGEX } = await import('@modern-js/builder-shared');
        const { applyOptionsChain } = await import('@modern-js/utils');

        const { merge: deepMerge } = await import('@modern-js/utils/lodash');

        const mergedOptions = applyOptionsChain<StylusLoaderOptions, undefined>(
          {
            sourceMap: isUseCssSourceMap(config),
          },
          options,
          undefined,
          deepMerge,
        );

        const rule = chain.module
          .rule(utils.CHAIN_ID.RULE.STYLUS)
          .test(STYLUS_REGEX);

        const { applyBaseCSSRule } = await import(
          `@modern-js/builder-${bundlerType}-provider/plugins/css`
        );
        await applyBaseCSSRule({
          rule,
          config: config as any,
          context: api.context,
          utils,
          importLoaders: 2,
        });

        rule
          .use(utils.CHAIN_ID.USE.STYLUS)
          .loader(require.resolve('stylus-loader'))
          .options(mergedOptions);
      });

      bundlerType === 'rspack' &&
        (api as any).modifyRspackConfig(async (rspackConfig: any) => {
          const { applyCSSModuleRule } = await import(
            '@modern-js/builder-rspack-provider/plugins/css'
          );
          const { STYLUS_REGEX } = await import('@modern-js/builder-shared');

          const config = api.getNormalizedConfig();

          const rules = rspackConfig.module?.rules;

          applyCSSModuleRule(rules, STYLUS_REGEX, config as any);
        });
    },
  };
}

/**
 * @deprecated Using builderPluginStylus instead.
 */
export const PluginStylus = builderPluginStylus;
