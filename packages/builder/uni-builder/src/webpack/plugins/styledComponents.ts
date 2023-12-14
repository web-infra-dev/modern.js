import type { RsbuildPlugin } from '@rsbuild/core';
import {
  isServerTarget,
  mergeChainedOptions,
  getDefaultStyledComponentsConfig,
  type ChainedConfig,
} from '@rsbuild/shared';
import type { PluginStyledComponentsOptions } from '@rsbuild/plugin-styled-components';

export const pluginStyledComponents = (
  userConfig: ChainedConfig<PluginStyledComponentsOptions> = {},
): RsbuildPlugin => ({
  name: 'uni-builder:styled-components',

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd }) => {
      const isSSR = isServerTarget(api.context.targets);

      const styledComponentsOptions = mergeChainedOptions({
        defaults: getDefaultStyledComponentsConfig(isProd, isSSR),
        options: userConfig,
      });

      if (!styledComponentsOptions) {
        return;
      }

      [CHAIN_ID.RULE.JS, CHAIN_ID.RULE.JS_DATA_URI].forEach(ruleId => {
        if (chain.module.rules.has(ruleId)) {
          const rule = chain.module.rule(ruleId);
          // apply swc
          if (rule.uses.has(CHAIN_ID.USE.SWC)) {
            // apply webpack swc-plugin
            rule.use(CHAIN_ID.USE.SWC).tap(swc => {
              swc.extensions.styledComponents = styledComponentsOptions;
              return swc;
            });
          } else if (rule.uses.has(CHAIN_ID.USE.BABEL)) {
            // apply babel
            rule.use(CHAIN_ID.USE.BABEL).tap(babelConfig => {
              babelConfig.plugins ??= [];
              babelConfig.plugins.push([
                require.resolve('babel-plugin-styled-components'),
                styledComponentsOptions,
              ]);
              return babelConfig;
            });
          }
        }
      });
    });
  },
});
