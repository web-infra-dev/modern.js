import type { BuilderTarget } from './builder';
import type { BuilderConfig } from './config';
import type { WebpackChain, WebpackConfig } from './thirdParty';

export type NodeEnv = 'development' | 'production' | 'test';

export type ModifyWebpackUtils = {
  env: NodeEnv;
  isProd: boolean;
  target: BuilderTarget;
  webpack: typeof import('webpack');
  isServer: boolean;
  CHAIN_ID: typeof import('@modern-js/utils').CHAIN_ID;
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
  config: BuilderConfig,
) => Promise<BuilderConfig | void> | BuilderConfig | void;

export type OnBeforeBuildFn = (params: {
  webpackConfigs: WebpackConfig[];
}) => Promise<void> | void;

export type OnAfterBuildFn = () => Promise<void> | void;

export type OnBeforeCreateCompilerFn = (params: {
  webpackConfigs: WebpackConfig[];
}) => Promise<void> | void;

export type OnAfterCreateCompilerFn = () => Promise<void> | void;

export type OnExitFn = () => void;
