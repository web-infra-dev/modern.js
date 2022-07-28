import type { WebBuilderConfig } from './config';
import type { WebpackChain, WebpackConfig } from './dependencies';

export type ModifyWebpackChainFn = (
  chain: WebpackChain,
) => Promise<void> | void;

export type ModifyWebpackConfigFn = (
  config: WebpackConfig,
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
