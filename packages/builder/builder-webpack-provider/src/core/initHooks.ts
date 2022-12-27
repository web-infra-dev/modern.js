import {
  createAsyncHook,
  OnExitFn,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  OnDevCompileDoneFn,
  ModifyBuilderConfigFn,
  OnAfterStartDevServerFn,
  OnBeforeStartDevServerFn,
  OnAfterCreateCompilerFn,
  OnBeforeCreateCompilerFn,
} from '@modern-js/builder-shared';
import type { ModifyBundlerChainFn } from '@modern-js/builder-shared';
import type { Compiler, MultiCompiler } from 'webpack';
import type {
  WebpackConfig,
  BuilderConfig,
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
} from '../types';

export function initHooks() {
  return {
    onExitHook: createAsyncHook<OnExitFn>(),
    onAfterBuildHook: createAsyncHook<OnAfterBuildFn>(),
    onBeforeBuildHook: createAsyncHook<OnBeforeBuildFn<WebpackConfig>>(),
    onDevCompileDoneHook: createAsyncHook<OnDevCompileDoneFn>(),
    modifyWebpackChainHook: createAsyncHook<ModifyWebpackChainFn>(),
    modifyWebpackConfigHook: createAsyncHook<ModifyWebpackConfigFn>(),
    modifyBuilderConfigHook:
      createAsyncHook<ModifyBuilderConfigFn<BuilderConfig>>(),
    onAfterCreateCompilerHook:
      createAsyncHook<OnAfterCreateCompilerFn<Compiler | MultiCompiler>>(),
    onBeforeCreateCompilerHook:
      createAsyncHook<OnBeforeCreateCompilerFn<WebpackConfig>>(),
    onAfterStartDevServerHook: createAsyncHook<OnAfterStartDevServerFn>(),
    onBeforeStartDevServerHook: createAsyncHook<OnBeforeStartDevServerFn>(),
    modifyBundlerChainHook: createAsyncHook<ModifyBundlerChainFn>(),
  };
}

export type Hooks = ReturnType<typeof initHooks>;
