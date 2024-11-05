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
} from './types/hooks';

export type AsyncHook<Callback extends (...args: any[]) => any> = {
  tap: (cb: Callback) => void;
  call: (...args: Parameters<Callback>) => Promise<Parameters<Callback>>;
};

export function createAsyncHook<
  Callback extends (...args: any[]) => any,
>(): AsyncHook<Callback> {
  const callbacks: Callback[] = [];

  const tap = (cb: Callback) => {
    callbacks.push(cb);
  };

  const call = async (...params: Parameters<Callback>) => {
    for (const callback of callbacks) {
      const result = await callback(...params);

      if (result !== undefined) {
        params[0] = result;
      }
    }

    return params;
  };

  return {
    tap,
    call,
  };
}

export function initHooks<Config, NormalizedConfig>() {
  return {
    /**
     * add config for this cli plugin
     */
    config: createAsyncHook<ConfigFn<Config>>(),
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

    modifyRsbuildConfig: createAsyncHook<ModifyRsbuildConfigFn>(),
    modifyBundlerChain: createAsyncHook<ModifyBundlerChainFn>(),
    modifyRspackConfig: createAsyncHook<ModifyRspackConfigFn>(),
    modifyWebpackChain: createAsyncHook<ModifyWebpackChainFn>(),
    modifyWebpackConfig: createAsyncHook<ModifyWebpackConfigFn>(),
    modifyHtmlPartials: createAsyncHook<ModifyHtmlPartialsFn>(),

    addCommand: createAsyncHook<AddCommandFn>(),
    addWatchFiles: createAsyncHook<AddWatchFilesFn>(),

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

export type Hooks<Config, NormalizedConfig> = ReturnType<
  typeof initHooks<Config, NormalizedConfig>
>;
