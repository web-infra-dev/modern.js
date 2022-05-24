import { CHAIN_ID } from '@modern-js/utils';
import type { Configuration, RuleSetRule } from 'webpack';
import type WebpackChain from '@modern-js/utils/webpack-chain';
import { BundleAnalyzerPlugin } from '../../compiled/webpack-bundle-analyzer';

export function enableBundleAnalyzer(
  config: WebpackChain,
  reportFilename: string,
) {
  config.plugin(CHAIN_ID.PLUGIN.BUNDLE_ANALYZER).use(BundleAnalyzerPlugin, [
    {
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename,
    },
  ]);
}

export function getWebpackUtils(config: Configuration) {
  return {
    addRules(rules: RuleSetRule[]) {
      if (Array.isArray(rules)) {
        config.module?.rules?.unshift(...rules);
      }
    },
    prependPlugins(plugins: Configuration['plugins']) {
      if (Array.isArray(plugins)) {
        config.plugins?.unshift(...plugins);
      }
    },
    appendPlugins(plugins: Configuration['plugins']) {
      if (Array.isArray(plugins)) {
        config.plugins?.push(...plugins);
      }
    },
    removePlugin(pluginName: string) {
      config.plugins = config.plugins?.filter(
        p => p.constructor.name !== pluginName,
      );
    },
  };
}
