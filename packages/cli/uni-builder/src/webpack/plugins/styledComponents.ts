import type { RsbuildPlugin } from '@rsbuild/core';
import { PLUGIN_SWC_NAME } from '@rsbuild/core';
import { type ConfigChain } from '@rsbuild/shared';
import { applyOptionsChain } from '@modern-js/utils';
import type { PluginStyledComponentsOptions } from '@rsbuild/plugin-styled-components';
import { isServerTarget } from '../../shared/utils';

const getDefaultStyledComponentsConfig = (isProd: boolean, ssr: boolean) => {
  return {
    ssr,
    // "pure" is used to improve dead code elimination in production.
    // we don't need to enable it in development because it will slow down the build process.
    pure: isProd,
    displayName: true,
    transpileTemplateLiterals: true,
  };
};

export const pluginStyledComponents = (
  userConfig: ConfigChain<PluginStyledComponentsOptions> = {},
): RsbuildPlugin => ({
  name: 'uni-builder:styled-components',

  pre: [PLUGIN_SWC_NAME, 'uni-builder:babel'],

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd }) => {
      const isSSR = isServerTarget(api.context.targets);

      const styledComponentsOptions = applyOptionsChain(
        getDefaultStyledComponentsConfig(isProd, isSSR),
        userConfig,
      );

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
