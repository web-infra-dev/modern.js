import type {
  OnAfterBuildFn,
  OnAfterCreateCompilerFn,
  OnBeforeBuildFn,
  OnBeforeCreateCompilerFn,
  OnDevCompileDoneFn,
} from '@rsbuild/core';
import type { Hooks } from '../../cli/hooks';
import type { PluginHook, PluginHookTap } from '../hooks';
import type { DeepPartial } from '../utils';
import type { AppContext } from './context';
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
export type CLIPluginAPI<Extends extends CLIPluginExtends> = Readonly<
  {
    isPluginExists: (name: string) => boolean;
    getAppContext: () => Readonly<
      AppContext<Extends> & Extends['extendContext']
    >;
    getConfig: () => Readonly<Extends['config']>;
    getNormalizedConfig: () => Readonly<Extends['normalizedConfig']>;
    getHooks: () => Readonly<
      Hooks<
        Extends['config'],
        Extends['normalizedConfig'],
        Extends['extendBuildUtils'],
        Extends['extendConfigUtils']
      > &
        Extends['extendHooks']
    >;

    updateAppContext: (
      appContext: DeepPartial<AppContext<Extends> & Extends['extendContext']>,
    ) => void;

    // config hooks
    config: PluginHookTap<ConfigFn<DeepPartial<Extends['config']>>>;
    modifyConfig: PluginHookTap<
      ModifyConfigFn<Extends['config'], Extends['extendConfigUtils']>
    >;
    modifyResolvedConfig: PluginHookTap<
      ModifyResolvedConfigFn<
        Extends['normalizedConfig'],
        Extends['extendConfigUtils']
      >
    >;

    // modify rsbuild config hooks
    modifyRsbuildConfig: PluginHookTap<
      ModifyRsbuildConfigFn<Extends['extendBuildUtils']>
    >;
    modifyBundlerChain: PluginHookTap<
      ModifyBundlerChainFn<Extends['extendBuildUtils']>
    >;
    /** Only works when bundler is Rspack */
    modifyRspackConfig: PluginHookTap<
      ModifyRspackConfigFn<Extends['extendBuildUtils']>
    >;
    modifyHtmlPartials: PluginHookTap<ModifyHtmlPartialsFn>;

    addCommand: PluginHookTap<AddCommandFn>;

    onPrepare: PluginHookTap<OnPrepareFn>;
    addWatchFiles: PluginHookTap<AddWatchFilesFn>;
    onFileChanged: PluginHookTap<OnFileChangedFn>;
    onBeforeRestart: PluginHookTap<OnBeforeRestartFn>;
    onBeforeCreateCompiler: PluginHookTap<OnBeforeCreateCompilerFn>;
    onAfterCreateCompiler: PluginHookTap<OnAfterCreateCompilerFn>;
    onDevCompileDone: PluginHookTap<OnDevCompileDoneFn>;
    onBeforeBuild: PluginHookTap<OnBeforeBuildFn>;
    onAfterBuild: PluginHookTap<OnAfterBuildFn>;
    onBeforeDev: PluginHookTap<OnBeforeDevFn>;
    onAfterDev: PluginHookTap<OnAfterDevFn>;
    onBeforeDeploy: PluginHookTap<OnBeforeDeployFn>;
    onAfterDeploy: PluginHookTap<OnAfterDeployFn>;
    onBeforeExit: PluginHookTap<OnBeforeExitFn>;
    _internalRuntimePlugins: PluginHookTap<InternalRuntimePluginsFn>;
    _internalServerPlugins: PluginHookTap<InternalServerPluginsFn>;
    modifyServerRoutes: PluginHookTap<ModifyServerRoutesFn>;
  } & CLIPluginExtendsAPI<Extends>
>;

export type CLIPluginExtendsAPI<Extends extends CLIPluginExtends> = {
  [K in keyof Extends['extendHooks']]: PluginHookTap<
    Extends['extendHooks'][K] extends PluginHook<infer Args>
      ? Args extends (...args: any[]) => any
        ? Args
        : (...args: any[]) => any
      : (...args: any[]) => any
  >;
} & Extends['extendApi'];

export type AllKeysForCLIPluginExtendsAPI<Extends extends CLIPluginExtends> =
  keyof CLIPluginExtendsAPI<Extends>;

export type AllValueForCLIPluginExtendsAPI<Extends extends CLIPluginExtends> =
  CLIPluginExtendsAPI<Extends>[AllKeysForCLIPluginExtendsAPI<Extends>];
