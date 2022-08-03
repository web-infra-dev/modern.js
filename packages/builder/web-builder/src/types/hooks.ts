import type { WebBuilderTarget } from './builder';
import type { WebBuilderConfig } from './config';
import type { webpack, WebpackChain, WebpackConfig } from './thirdParty';

export type ModifyWebpackUtils = {
  target: WebBuilderTarget;
  webpack: typeof webpack;
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
  config: WebBuilderConfig,
) => Promise<WebBuilderConfig | void> | WebBuilderConfig | void;

export type OnBeforeBuildFn = (params: {
  webpackConfigs: WebpackConfig[];
}) => Promise<void> | void;

export type OnAfterBuildFn = () => Promise<void> | void;

export type OnBeforeCreateCompilerFn = (params: {
  webpackConfigs: WebpackConfig[];
}) => Promise<void> | void;

export type OnAfterCreateCompilerFn = () => Promise<void> | void;

export type OnExitFn = () => void;
