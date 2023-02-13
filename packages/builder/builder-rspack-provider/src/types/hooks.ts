import type { ModifyChainUtils } from '@modern-js/builder-shared';
import type {
  RspackConfig,
  RspackRuleSet,
  RspackPluginInstance,
} from './rspack';

export type ModifyRspackConfigUtils = ModifyChainUtils & {
  addRules: (rules: RspackRuleSet | RspackRuleSet[]) => void;
  prependPlugins: (
    plugins: RspackPluginInstance | RspackPluginInstance[],
  ) => void;
  appendPlugins: (
    plugins: RspackPluginInstance | RspackPluginInstance[],
  ) => void;
  removePlugin: (pluginName: string) => void;
  mergeConfig: typeof import('../../compiled/webpack-merge').merge;
};

export type ModifyRspackConfigFn = (
  config: RspackConfig,
  utils: ModifyRspackConfigUtils,
) => Promise<RspackConfig | void> | RspackConfig | void;
