import { ensureArray, WebpackChain } from '@modern-js/utils';
import type { IAppContext, NormalizedConfig } from '@modern-js/core';
import type {
  Configuration,
  RuleSetRule,
  WebpackPluginInstance,
} from 'webpack';
import {
  CSS_REGEX,
  CSS_MODULE_REGEX,
  NODE_MODULES_REGEX,
} from '../utils/constants';

export type ChainUtils = {
  chain: WebpackChain;
  config: NormalizedConfig;
  loaders: WebpackChain.Rule<WebpackChain.Module>;
  appContext: IAppContext;
};

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
