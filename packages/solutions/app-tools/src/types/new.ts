import type { DevToolData, RegisterBuildPlatformResult } from '@modern-js/core';
import type {
  AppContext,
  AsyncHook,
  CollectAsyncHook,
  InternalContext,
  PluginHook,
  PluginHookTap,
  TransformFunction,
} from '@modern-js/plugin-v2';
import type { Hooks } from '@modern-js/plugin-v2/cli';
import type {
  Entrypoint,
  HtmlPartials,
  HtmlTemplates,
  NestedRouteForCli,
  PageRoute,
  RouteLegacy,
  ServerPlugin,
  ServerRoute,
} from '@modern-js/types';
import type { AppTools } from '.';
import type { getHookRunners } from '../compat/hooks';
import type { AppToolsNormalizedConfig, AppToolsUserConfig } from './config';
import type { Bundler } from './utils';

export type AfterPrepareFn = () => Promise<void> | void;
export type CheckEntryPointFn = TransformFunction<{
  path: string;
  entry: false | string;
}>;
export type ModifyEntrypointsFn = TransformFunction<{
  entrypoints: Entrypoint[];
}>;
export type ModifyFileSystemRoutesFn = TransformFunction<{
  entrypoint: Entrypoint;
  routes: RouteLegacy[] | (NestedRouteForCli | PageRoute)[];
}>;
export type DeplpoyFn = () => Promise<void> | void;
export type GenerateEntryCodeFn = (params: {
  entrypoints: Entrypoint[];
}) => Promise<void> | void;
export type BeforeGenerateRoutesFn = TransformFunction<{
  entrypoint: Entrypoint;
  code: string;
}>;
export type BeforePrintInstructionsFn = TransformFunction<{
  instructions: string;
}>;
export type RegisterDevFn = () => Promise<DevToolData> | DevToolData;
export type RegisterBuildPlatformFn = () =>
  | Promise<RegisterBuildPlatformResult>
  | RegisterBuildPlatformResult;
export type AddRuntimeExportsFn = () => Promise<void> | void;

export interface AppToolsExtendAPI<B extends Bundler = 'webpack'> {
  onAfterPrepare: PluginHookTap<AfterPrepareFn>;
  deploy: PluginHookTap<DeplpoyFn>;

  checkEntryPoint: PluginHookTap<CheckEntryPointFn>;
  modifyEntrypoints: PluginHookTap<ModifyEntrypointsFn>;
  modifyFileSystemRoutes: PluginHookTap<ModifyFileSystemRoutesFn>;

  generateEntryCode: PluginHookTap<GenerateEntryCodeFn>;
  onBeforeGenerateRoutes: PluginHookTap<BeforeGenerateRoutesFn>;
  /**
   * @deprecated
   */
  onBeforePrintInstructions: PluginHookTap<BeforePrintInstructionsFn>;
  /**
   * @deprecated
   */
  registerDev: PluginHookTap<RegisterDevFn>;
  /**
   * @deprecated
   */
  registerBuildPlatform: PluginHookTap<RegisterBuildPlatformFn>;
  /**
   * @deprecated
   */
  addRuntimeExports: PluginHookTap<AddRuntimeExportsFn>;

  /**
   * @deprecated use getAppContext instead
   */
  useAppContext: () => AppToolsContext<B>;
  /**
   * @deprecated use getConfig instead
   */
  useConfigContext: () => AppToolsUserConfig<B>;
  /**
   * @deprecated use getNormalizedConfig instead
   */
  useResolvedConfigContext: () => AppToolsNormalizedConfig<
    AppToolsUserConfig<B>
  >;
  /**
   * @deprecated use api.xx instead
   */
  useHookRunners: () => ReturnType<typeof getHookRunners>;
}

export interface AppToolsExtendHooks
  extends Record<string, PluginHook<(...args: any[]) => any>> {
  onAfterPrepare: AsyncHook<AfterPrepareFn>;
  deploy: AsyncHook<DeplpoyFn>;
  checkEntryPoint: AsyncHook<CheckEntryPointFn>;
  modifyEntrypoints: AsyncHook<ModifyEntrypointsFn>;
  modifyFileSystemRoutes: AsyncHook<ModifyFileSystemRoutesFn>;
  generateEntryCode: AsyncHook<GenerateEntryCodeFn>;
  onBeforeGenerateRoutes: AsyncHook<BeforeGenerateRoutesFn>;
  /**
   * @deprecated
   */
  onBeforePrintInstructions: AsyncHook<BeforePrintInstructionsFn>;
  /**
   * @deprecated
   */
  registerDev: CollectAsyncHook<RegisterDevFn>;
  /**
   * @deprecated
   */
  registerBuildPlatform: CollectAsyncHook<RegisterBuildPlatformFn>;
  /**
   * @deprecated
   */
  addRuntimeExports: AsyncHook<AddRuntimeExportsFn>;
}

export interface AppToolsExtendContext<B extends Bundler = 'webpack'> {
  metaName: string;
  internalDirectory: string;
  sharedDirectory: string;
  internalDirAlias: string;
  internalSrcAlias: string;
  apiDirectory: string;
  lambdaDirectory: string;
  serverConfigFile: string;
  runtimeConfigFile: string;
  serverPlugins: ServerPlugin[];
  moduleType: 'module' | 'commonjs';
  /** Information for entry points */
  entrypoints: Entrypoint[];
  /** Selected entry points */
  checkedEntries: string[];
  /** Information for server routes */
  serverRoutes: ServerRoute[];
  /** Whether to use api only mode */
  apiOnly: boolean;
  _internalContext: InternalContext<AppTools<B>>;
  /**
   * Information for HTML templates by entry
   * @private
   */
  partialsByEntrypoint?: Record<string, HtmlPartials>;
  /**
   * Information for HTML templates
   * @private
   */
  htmlTemplates: HtmlTemplates;
  /**
   * @deprecated compat old plugin, default is app tools
   */
  toolsType?: string;
  /**
   * Identification for bff runtime framework
   * @private
   */
  bffRuntimeFramework?: string;
}

export type AppToolsContext<B extends Bundler = 'webpack'> = AppContext<
  AppTools<B>
> &
  AppToolsExtendContext<B>;

export type AppToolsHooks<B extends Bundler = 'webpack'> = Hooks<
  AppToolsUserConfig<B>,
  AppToolsNormalizedConfig,
  {},
  {}
> &
  AppToolsExtendHooks;
