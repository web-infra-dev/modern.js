import { CHAIN_ID, ensureArray } from '@modern-js/utils';
import type {
  Configuration,
  RuleSetRule,
  WebpackPluginInstance,
} from 'webpack';
import type WebpackChain from '@modern-js/utils/webpack-chain';
import { BundleAnalyzerPlugin } from '../../compiled/webpack-bundle-analyzer';
import {
  CSS_REGEX,
  CSS_MODULE_REGEX,
  NODE_MODULES_REGEX,
} from '../utils/constants';

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
    addRules(rules: RuleSetRule | RuleSetRule[]) {
      const ruleArr = ensureArray(rules);
      config.module?.rules?.unshift(...ruleArr);
    },
    prependPlugins(plugins: WebpackPluginInstance | WebpackPluginInstance[]) {
      const pluginArr = ensureArray(plugins);
      config.plugins?.unshift(...pluginArr);
    },
    appendPlugins(plugins: WebpackPluginInstance | WebpackPluginInstance[]) {
      const pluginArr = ensureArray(plugins);
      config.plugins?.push(...pluginArr);
    },
    removePlugin(pluginName: string) {
      config.plugins = config.plugins?.filter(
        p => p.constructor.name !== pluginName,
      );
    },
  };
}

export const isNodeModulesCss = (path: string) =>
  NODE_MODULES_REGEX.test(path) &&
  CSS_REGEX.test(path) &&
  !CSS_MODULE_REGEX.test(path);
