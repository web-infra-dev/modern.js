import type {
  OnAfterBuildFn,
  OnAfterCreateCompilerFn,
  OnBeforeBuildFn,
  OnBeforeCreateCompilerFn,
  OnDevCompileDoneFn,
} from '@rsbuild/core';
import { createAsyncHook, createCollectAsyncHook } from '../hooks';
import type {
  AddCommandFn,
  AddWatchFilesFn,
  ConfigFn,
  InternalRuntimePluginsFn,
  InternalServerPluginsFn,
  ModifyBundlerChainFn,
  ModifyConfigFn,
  ModifyHtmlPartialsFn,
  ModifyResolvedConfigFn,
  ModifyRsbuildConfigFn,
  ModifyRspackConfigFn,
  ModifyServerRoutesFn,
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
  OnAfterDeployFn,
  OnAfterDevFn,
  OnBeforeDeployFn,
  OnBeforeDevFn,
  OnBeforeExitFn,
  OnBeforeRestartFn,
  OnFileChangedFn,
  OnPrepareFn,
  RuntimePluginConfig,
  ServerPluginConfig,
} from '../types/cli/hooks';
import type { DeepPartial } from '../types/utils';

export type {
  OnAfterBuildFn,
  OnAfterCreateCompilerFn,
  OnBeforeBuildFn,
  OnBeforeCreateCompilerFn,
  OnDevCompileDoneFn,
  AddCommandFn,
  AddWatchFilesFn,
  ConfigFn,
  ModifyBundlerChainFn,
  ModifyConfigFn,
  ModifyHtmlPartialsFn,
  ModifyResolvedConfigFn,
  ModifyRsbuildConfigFn,
  ModifyRspackConfigFn,
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
  OnAfterDeployFn,
  OnBeforeDeployFn,
  OnBeforeDevFn,
  OnAfterDevFn,
  OnBeforeExitFn,
  OnBeforeRestartFn,
  OnFileChangedFn,
  OnPrepareFn,
  InternalRuntimePluginsFn,
  InternalServerPluginsFn,
  ModifyServerRoutesFn,
  RuntimePluginConfig,
  ServerPluginConfig,
};

export function initHooks<
  Config,
  NormalizedConfig,
  ExtendBuildUtils,
  ExtendConfigUtils,
>() {
  return {
    /**
     * add config for this cli plugin
     */
    config: createCollectAsyncHook<ConfigFn<DeepPartial<Config>>>(),
    /**
     * @private
     * modify config for this cli plugin
     */
    modifyConfig: createAsyncHook<ModifyConfigFn<Config, ExtendConfigUtils>>(),
    /**
     * modify final config
     */
    modifyResolvedConfig:
      createAsyncHook<
        ModifyResolvedConfigFn<NormalizedConfig, ExtendConfigUtils>
      >(),

    modifyRsbuildConfig:
      createAsyncHook<ModifyRsbuildConfigFn<ExtendBuildUtils>>(),
    modifyBundlerChain:
      createAsyncHook<ModifyBundlerChainFn<ExtendBuildUtils>>(),
    modifyRspackConfig:
      createAsyncHook<ModifyRspackConfigFn<ExtendBuildUtils>>(),
    modifyWebpackChain:
      createAsyncHook<ModifyWebpackChainFn<ExtendBuildUtils>>(),
    modifyWebpackConfig:
      createAsyncHook<ModifyWebpackConfigFn<ExtendBuildUtils>>(),
    modifyHtmlPartials: createAsyncHook<ModifyHtmlPartialsFn>(),

    addCommand: createAsyncHook<AddCommandFn>(),
    addWatchFiles: createCollectAsyncHook<AddWatchFilesFn>(),

    onPrepare: createAsyncHook<OnPrepareFn>(),
    onFileChanged: createAsyncHook<OnFileChangedFn>(),
    onBeforeRestart: createAsyncHook<OnBeforeRestartFn>(),
    onBeforeCreateCompiler: createAsyncHook<OnBeforeCreateCompilerFn>(),
    onAfterCreateCompiler: createAsyncHook<OnAfterCreateCompilerFn>(),
    onDevCompileDone: createAsyncHook<OnDevCompileDoneFn>(),
    onBeforeBuild: createAsyncHook<OnBeforeBuildFn>(),
    onAfterBuild: createAsyncHook<OnAfterBuildFn>(),
    onBeforeDev: createAsyncHook<OnBeforeDevFn>(),
    onAfterDev: createAsyncHook<OnAfterDevFn>(),
    onBeforeDeploy: createAsyncHook<OnBeforeDeployFn>(),
    onAfterDeploy: createAsyncHook<OnAfterDeployFn>(),
    onBeforeExit: createAsyncHook<OnBeforeExitFn>(),
    _internalRuntimePlugins: createAsyncHook<InternalRuntimePluginsFn>(),
    _internalServerPlugins: createAsyncHook<InternalServerPluginsFn>(),
    modifyServerRoutes: createAsyncHook<ModifyServerRoutesFn>(),
  };
}

export type Hooks<
  Config,
  NormalizedConfig,
  ExtendBuildUtils,
  ExtendConfigUtils,
> = ReturnType<
  typeof initHooks<
    Config,
    NormalizedConfig,
    ExtendBuildUtils,
    ExtendConfigUtils
  >
>;
