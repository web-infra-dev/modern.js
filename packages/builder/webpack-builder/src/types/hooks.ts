import type { Compiler, MultiCompiler, MultiStats, Stats } from 'webpack';
import type { BuilderTarget } from './builder';
import type { NormalizedConfig } from './config';
import type { WebpackChain, WebpackConfig } from './thirdParty';

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
) => Promise<void> | void;

export type ModifyWebpackConfigFn = (
  config: WebpackConfig,
  utils: ModifyWebpackUtils,
) => Promise<WebpackConfig | void> | WebpackConfig | void;

export type ModifyBuilderConfigFn = (
  config: NormalizedConfig,
) => Promise<NormalizedConfig | void> | NormalizedConfig | void;

export type OnBeforeBuildFn = (params: {
  webpackConfigs: WebpackConfig[];
}) => Promise<void> | void;

export type OnAfterBuildFn = (params: {
  stats?: Stats | MultiStats;
}) => Promise<void> | void;

export type OnDevCompileDoneFn = (params: {
  isFirstCompile: boolean;
}) => Promise<void> | void;

export type OnBeforeCreateCompilerFn = (params: {
  webpackConfigs: WebpackConfig[];
}) => Promise<void> | void;

export type OnAfterCreateCompilerFn = (params: {
  compiler: Compiler | MultiCompiler;
}) => Promise<void> | void;

export type OnBeforeStartDevServerFn = () => Promise<void> | void;

export type OnAfterStartDevServerFn = (params: {
  port: number;
}) => Promise<void> | void;

export type OnExitFn = () => void;
