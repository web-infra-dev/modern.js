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

export function PluginStylus(
  options?: PluginStylusOptions,
): BuilderPlugin<BuilderPluginAPI> {
  return {
    name: 'builder-plugin-stylus',

    async setup(api) {
      api.modifyWebpackChain(async (chain, utils) => {
        const config = api.getNormalizedConfig();
        const { STYLUS_REGEX } = await import('@modern-js/builder-shared');
        const { applyOptionsChain } = await import('@modern-js/utils');
        const { applyBaseCSSRule } = await import(
          '@modern-js/builder-webpack-provider/plugins/css'
        );
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

        await applyBaseCSSRule(rule, config, api.context, utils);

        rule
          .use(utils.CHAIN_ID.USE.STYLUS)
          .loader(require.resolve('stylus-loader'))
          .options(mergedOptions);
      });
    },
  };
}
