import type {
  ModifyBundlerChainFn,
  ModifyRsbuildConfigFn,
  ModifyRspackConfigFn,
  ModifyWebpackChainFn,
} from '@rsbuild/core';
import type { AppContext } from './context';
import type { PluginHook } from './plugin';

/**
 * Define a generic CLI plugin API that provider can extend as needed.
 */
export type CLIPluginAPI<Config = {}, NormalizedConfig = {}> = Readonly<{
  getAppContext: () => Readonly<AppContext>;
  getConfig: () => Readonly<Config>;
  getNormalizedConfig: () => Readonly<NormalizedConfig>;

  modifyRsbuildConfig: PluginHook<ModifyRsbuildConfigFn>;
  modifyBundlerChain: PluginHook<ModifyBundlerChainFn>;
  /** Only works when bundler is Rspack */
  modifyRspackConfig: PluginHook<ModifyRspackConfigFn>;
  /** Only works when bundler is Webpack */
  modifyWebpackChain: PluginHook<ModifyWebpackChainFn>;
  /** Only works when bundler is Webpack */
  // modifyWebpackConfig: PluginHook<ModifyWebpackConfigFn>;
}>;
