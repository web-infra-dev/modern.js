import type { Compiler, MultiCompiler, MultiStats, Stats } from 'webpack';
import type { BuilderTarget } from './builder';
import type { BuilderConfig } from './config';
import type { WebpackChain, WebpackConfig } from './thirdParty';
import type { PromiseOrNot } from './utils';

export type NodeEnv = 'development' | 'production' | 'test';

export type ModifyWebpackUtils = {
  env: NodeEnv;
  isProd: boolean;
  target: BuilderTarget;
  webpack: typeof import('webpack');
  isServer: boolean;
  CHAIN_ID: typeof import('@modern-js/utils').CHAIN_ID;
  getCompiledPath: (name: string) => string;
};

export type ModifyWebpackChainFn = (
  chain: WebpackChain,
  utils: ModifyWebpackUtils,
) => PromiseOrNot<void>;

export type ModifyWebpackConfigFn = (
  config: WebpackConfig,
  utils: ModifyWebpackUtils,
) => PromiseOrNot<WebpackConfig | void>;

export type ModifyBuilderConfigFn = (
  config: BuilderConfig,
) => PromiseOrNot<BuilderConfig | void> | void;

export type OnBeforeBuildFn = (params: {
  webpackConfigs: WebpackConfig[];
}) => PromiseOrNot<void>;

export type OnAfterBuildFn = (params: {
  stats?: Stats | MultiStats;
}) => PromiseOrNot<void>;

export type OnDevCompileDoneFn = (params: {
  isFirstCompile: boolean;
}) => PromiseOrNot<void>;

export type OnBeforeCreateCompilerFn = (params: {
  webpackConfigs: WebpackConfig[];
}) => PromiseOrNot<void>;

export type OnAfterCreateCompilerFn = (params: {
  compiler: Compiler | MultiCompiler;
}) => PromiseOrNot<void>;

export type OnBeforeStartDevServerFn = () => PromiseOrNot<void>;

export type OnAfterStartDevServerFn = (params: {
  port: number;
}) => PromiseOrNot<void>;

export type OnExitFn = () => void;
