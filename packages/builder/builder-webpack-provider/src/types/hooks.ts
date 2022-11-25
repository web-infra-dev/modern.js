import type { NodeEnv, BuilderTarget } from '@modern-js/builder-shared';
import type { BuilderConfig } from './config';
import type { WebpackChain, WebpackConfig } from './thirdParty';
import type {
  Stats,
  Compiler,
  MultiStats,
  RuleSetRule,
  MultiCompiler,
  WebpackPluginInstance,
} from 'webpack';
import type { ChainIdentifier } from '@modern-js/utils';

export type ModifyWebpackChainUtils = {
  env: NodeEnv;
  /** @deprecated Use target instead. */
  name: string;
  isProd: boolean;
  target: BuilderTarget;
  webpack: typeof import('webpack');
  isServer: boolean;
  isWebWorker: boolean;
  CHAIN_ID: ChainIdentifier;
  getCompiledPath: (name: string) => string;
  HtmlWebpackPlugin: typeof import('html-webpack-plugin');
};

export type ModifyWebpackConfigUtils = ModifyWebpackChainUtils & {
  addRules: (rules: RuleSetRule | RuleSetRule[]) => void;
  prependPlugins: (
    plugins: WebpackPluginInstance | WebpackPluginInstance[],
  ) => void;
  appendPlugins: (
    plugins: WebpackPluginInstance | WebpackPluginInstance[],
  ) => void;
  removePlugin: (pluginName: string) => void;
};

export type ModifyWebpackChainFn = (
  chain: WebpackChain,
  utils: ModifyWebpackChainUtils,
) => Promise<void> | void;

export type ModifyWebpackConfigFn = (
  config: WebpackConfig,
  utils: ModifyWebpackConfigUtils,
) => Promise<WebpackConfig | void> | WebpackConfig | void;

export type ModifyBuilderConfigFn = (
  config: BuilderConfig,
) => Promise<BuilderConfig | void> | BuilderConfig | void;

export type OnBeforeBuildFn = (params: {
  bundlerConfigs?: WebpackConfig[];
}) => Promise<void> | void;

export type OnAfterBuildFn = (params: {
  stats?: Stats | MultiStats;
}) => Promise<void> | void;

export type OnDevCompileDoneFn = (params: {
  isFirstCompile: boolean;
}) => Promise<void> | void;

export type OnBeforeCreateCompilerFn = (params: {
  bundlerConfigs: WebpackConfig[];
}) => Promise<void> | void;

export type OnAfterCreateCompilerFn = (params: {
  compiler: Compiler | MultiCompiler;
}) => Promise<void> | void;

export type OnBeforeStartDevServerFn = () => Promise<void> | void;

export type OnAfterStartDevServerFn = (params: {
  port: number;
}) => Promise<void> | void;

export type OnExitFn = () => void;
