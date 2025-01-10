import type {
  OnAfterBuildFn,
  OnAfterCreateCompilerFn,
  OnBeforeBuildFn,
  OnBeforeCreateCompilerFn,
} from '@rsbuild/core';
import { createAsyncHook, createCollectAsyncHook } from '../hooks';
import type {
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
  OnAfterDevFn,
  OnBeforeDeployFn,
  OnBeforeDevFn,
  OnBeforeExitFn,
  OnBeforeRestartFn,
  OnFileChangedFn,
  OnPrepareFn,
} from '../types/cli/hooks';
import type { DeepPartial } from '../types/utils';

export function initHooks<Config, NormalizedConfig, ExtendBuildUtils>() {
  return {
    /**
     * add config for this cli plugin
     */
    config: createCollectAsyncHook<ConfigFn<DeepPartial<Config>>>(),
    /**
     * @private
     * modify config for this cli plugin
     */
    modifyConfig: createAsyncHook<ModifyConfigFn<Config>>(),
    /**
     * modify final config
     */
    modifyResolvedConfig:
      createAsyncHook<ModifyResolvedConfigFn<NormalizedConfig>>(),

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
    onBeforeBuild: createAsyncHook<OnBeforeBuildFn>(),
    onAfterBuild: createAsyncHook<OnAfterBuildFn>(),
    onBeforeDev: createAsyncHook<OnBeforeDevFn>(),
    onAfterDev: createAsyncHook<OnAfterDevFn>(),
    onBeforeDeploy: createAsyncHook<OnBeforeDeployFn>(),
    onAfterDeploy: createAsyncHook<OnAfterDeployFn>(),
    onBeforeExit: createAsyncHook<OnBeforeExitFn>(),
  };
}

export type Hooks<Config, NormalizedConfig, ExtendBuildUtils> = ReturnType<
  typeof initHooks<Config, NormalizedConfig, ExtendBuildUtils>
>;
