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
import type { Hooks } from '../../cli/hooks';
import type { PluginHook, PluginHookTap } from '../hooks';
import type { DeepPartial } from '../utils';
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

/**
 * Define a generic CLI plugin API that provider can extend as needed.
 */
export type CLIPluginAPI<Config, NormalizedConfig> = Readonly<{
  getAppContext: () => Readonly<AppContext<Config, NormalizedConfig>>;
  getConfig: () => Readonly<Config>;
  getNormalizedConfig: () => Readonly<NormalizedConfig>;
  getHooks: () => Readonly<
    Hooks<Config, NormalizedConfig> &
      Record<string, PluginHook<(...args: any[]) => any>>
  >;

  // config hooks TOOD check
  config: PluginHookTap<ConfigFn<DeepPartial<Config>>>;
  modifyConfig: PluginHookTap<ModifyConfigFn<Config>>;
  modifyResolvedConfig: PluginHookTap<ModifyResolvedConfigFn<NormalizedConfig>>;

  // modify rsbuild config hooks
  modifyRsbuildConfig: PluginHookTap<ModifyRsbuildConfigFn>;
  modifyBundlerChain: PluginHookTap<ModifyBundlerChainFn>;
  /** Only works when bundler is Rspack */
  modifyRspackConfig: PluginHookTap<ModifyRspackConfigFn>;
  /** Only works when bundler is Webpack */
  modifyWebpackChain: PluginHookTap<ModifyWebpackChainFn>;
  /** Only works when bundler is Webpack */
  modifyWebpackConfig: PluginHookTap<ModifyWebpackConfigFn>;
  modifyHtmlPartials: PluginHookTap<ModifyHtmlPartialsFn>;

  addCommand: PluginHookTap<AddCommandFn>;

  onPrepare: PluginHookTap<OnPrepareFn>;
  onWatchFiles: PluginHookTap<AddWatchFilesFn>;
  onFileChanged: PluginHookTap<OnFileChangedFn>;
  onBeforeRestart: PluginHookTap<OnBeforeRestartFn>;
  onBeforeCreateCompiler: PluginHookTap<OnBeforeCreateCompilerFn>;
  onAfterCreateCompiler: PluginHookTap<OnAfterCreateCompilerFn>;
  onBeforeBuild: PluginHookTap<OnBeforeBuildFn>;
  onAfterBuild: PluginHookTap<OnAfterBuildFn>;
  onBeforeDev: PluginHookTap<OnBeforeDevFn>;
  onAfterDev: PluginHookTap<OnAfterDevFn>;
  onBeforeDeploy: PluginHookTap<OnBeforeDeployFn>;
  onAfterDeploy: PluginHookTap<OnAfterDeployFn>;
  onBeforeExit: PluginHookTap<OnBeforeExitFn>;
}>;
