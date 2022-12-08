import type { NodeEnv, BuilderTarget } from '@modern-js/builder-shared';
import type { BuilderConfig } from './config';
import type {
  RspackConfig,
  RspackRuleSet,
  RspackPluginInstance,
  Compiler,
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

export type ModifyBuilderConfigFn = (
  config: BuilderConfig,
) => Promise<BuilderConfig | void> | BuilderConfig | void;

export type OnBeforeCreateCompilerFn = (params: {
  bundlerConfigs: RspackConfig[];
}) => Promise<void> | void;

// TODO: support MultiCompiler
export type OnAfterCreateCompilerFn = (params: {
  compiler: Compiler;
}) => Promise<void> | void;
