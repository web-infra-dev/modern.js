import type {
  ModifyBundlerChainFn,
  ModifyRsbuildConfigFn,
  ModifyRspackConfigFn,
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
  OnAfterBuildFn,
  OnAfterCreateCompilerFn,
  OnBeforeBuildFn,
  OnBeforeCreateCompilerFn,
} from '@rsbuild/core';
import type { AppContext } from './context';
import type {
  AddCommandFn,
  AddWatchFilesFn,
  ConfigFn,
  ModifyConfigFn,
  ModifyHtmlPartialsFn,
  ModifyResolvedConfigFn,
  OnAfterDeployFn,
  OnAfterDevFn,
  OnBeforeDeployFn,
  OnBeforeDevFn,
  OnBeforeExitFn,
  OnBeforeRestartFn,
  OnFileChangedFn,
  OnPrepareFn,
} from './hooks';
import type { PluginHook } from './plugin';
import type { DeepPartial } from './utils';

/**
 * Define a generic CLI plugin API that provider can extend as needed.
 */
export type CLIPluginAPI<Config, NormalizedConfig> = Readonly<{
  getAppContext: () => Readonly<AppContext<Config, NormalizedConfig>>;
  getConfig: () => Readonly<Config>;
  getNormalizedConfig: () => Readonly<NormalizedConfig>;

  // config hooks TOOD check
  config: PluginHook<ConfigFn<DeepPartial<Config>>>;
  modifyConfig: PluginHook<ModifyConfigFn<Config>>;
  modifyResolvedConfig: PluginHook<ModifyResolvedConfigFn<NormalizedConfig>>;

  // modify rsbuild config hooks
  modifyRsbuildConfig: PluginHook<ModifyRsbuildConfigFn>;
  modifyBundlerChain: PluginHook<ModifyBundlerChainFn>;
  /** Only works when bundler is Rspack */
  modifyRspackConfig: PluginHook<ModifyRspackConfigFn>;
  /** Only works when bundler is Webpack */
  modifyWebpackChain: PluginHook<ModifyWebpackChainFn>;
  /** Only works when bundler is Webpack */
  modifyWebpackConfig: PluginHook<ModifyWebpackConfigFn>;
  modifyHtmlPartials: PluginHook<ModifyHtmlPartialsFn>;

  addCommand: PluginHook<AddCommandFn>;

  onPrepare: PluginHook<OnPrepareFn>;
  onWatchFiles: PluginHook<AddWatchFilesFn>;
  onFileChanged: PluginHook<OnFileChangedFn>;
  onBeforeRestart: PluginHook<OnBeforeRestartFn>;
  onBeforeCreateCompiler: PluginHook<OnBeforeCreateCompilerFn>;
  onAfterCreateCompiler: PluginHook<OnAfterCreateCompilerFn>;
  onBeforeBuild: PluginHook<OnBeforeBuildFn>;
  onAfterBuild: PluginHook<OnAfterBuildFn>;
  onBeforeDev: PluginHook<OnBeforeDevFn>;
  onAfterDev: PluginHook<OnAfterDevFn>;
  onBeforeDeploy: PluginHook<OnBeforeDeployFn>;
  onAfterDeploy: PluginHook<OnAfterDeployFn>;
  onBeforeExit: PluginHook<OnBeforeExitFn>;
}>;
