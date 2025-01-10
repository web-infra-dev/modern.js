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
import type { CLIPluginExtends } from './plugin';

/**
 * Define a generic CLI plugin API that provider can extend as needed.
 */
export type CLIPluginAPI<Extends extends CLIPluginExtends> = Readonly<{
  isPluginExists: (name: string) => boolean;
  getAppContext: () => Readonly<AppContext<Extends> & Extends['extendContext']>;
  getConfig: () => Readonly<Extends['config']>;
  getNormalizedConfig: () => Readonly<Extends['normalizedConfig']>;
  getHooks: () => Readonly<
    Hooks<Extends['config'], Extends['normalizedConfig']> &
      Extends['extendHooks']
  >;

  updateAppContext: (
    appContext: DeepPartial<AppContext<Extends> & Extends['extendContext']>,
  ) => void;

  // config hooks
  config: PluginHookTap<ConfigFn<DeepPartial<Extends['config']>>>;
  modifyConfig: PluginHookTap<ModifyConfigFn<Extends['config']>>;
  modifyResolvedConfig: PluginHookTap<
    ModifyResolvedConfigFn<Extends['normalizedConfig']>
  >;

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
  addWatchFiles: PluginHookTap<AddWatchFilesFn>;
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
