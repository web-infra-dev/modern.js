import type { NodeEnv, BuilderTarget } from '@modern-js/builder-shared';
import type {
  RspackConfig,
  RspackRuleSet,
  RspackPluginInstance,
} from './rspack';

export type ModifyRspackConfigUtils = {
  env: NodeEnv;
  isProd: boolean;
  target: BuilderTarget;
  isServer: boolean;
  isWebWorker: boolean;
  getCompiledPath: (name: string) => string;

  addRules: (rules: RspackRuleSet | RspackRuleSet[]) => void;
  prependPlugins: (
    plugins: RspackPluginInstance | RspackPluginInstance[],
  ) => void;
  appendPlugins: (
    plugins: RspackPluginInstance | RspackPluginInstance[],
  ) => void;
  removePlugin: (pluginName: string) => void;
};

export type ModifyRspackConfigFn = (
  config: RspackConfig,
  utils: ModifyRspackConfigUtils,
) => Promise<RspackConfig | void> | RspackConfig | void;
