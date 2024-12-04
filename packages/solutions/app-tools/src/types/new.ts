import type { DevToolData, RegisterBuildPlatformResult } from '@modern-js/core';
import type {
  AppContext,
  AsyncHook,
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
import type { getHookRunners } from '../new/compat/hooks';
import type { AppToolsNormalizedConfig, AppToolsUserConfig } from './config';
import type { RuntimePlugin } from './hooks';
import type { Bundler } from './utils';

export type BeforeConfigFn = () => Promise<void> | void;
export type AfterPrepareFn = () => Promise<void> | void;
export type InternalRuntimePluginsFn = TransformFunction<{
  entrypoint: Entrypoint;
  plugins: RuntimePlugin[];
}>;
export type InternalServerPluginsFn = TransformFunction<{
  plugins: ServerPlugin[];
}>;
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
export type ModifyServerRoutesFn = TransformFunction<{ routes: ServerRoute[] }>;
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
export type RegisterDevFn = (params: {
  name: string;
  entry: string;
  type: string;
  config: any;
}) => Promise<DevToolData> | DevToolData;
export type RegisterBuildPlatformFn = (params: {
  name: string;
  entry: string;
  type: string;
  config: any;
}) => Promise<RegisterBuildPlatformResult> | RegisterBuildPlatformResult;
export type AddRuntimeExportsFn = () => Promise<void> | void;

export interface AppToolsExtendAPI<B extends Bundler = 'webpack'> {
  onBeforeConfig: PluginHookTap<BeforeConfigFn>;
  onAfterPrepare: PluginHookTap<AfterPrepareFn>;
  deploy: PluginHookTap<DeplpoyFn>;

  _internalRuntimePlugins: PluginHookTap<InternalRuntimePluginsFn>;
  _internalServerPlugins: PluginHookTap<InternalServerPluginsFn>;
  checkEntryPoint: PluginHookTap<CheckEntryPointFn>;
  modifyEntrypoints: PluginHookTap<ModifyEntrypointsFn>;
  modifyFileSystemRoutes: PluginHookTap<ModifyFileSystemRoutesFn>;
  modifyServerRoutes: PluginHookTap<ModifyServerRoutesFn>;

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
  onBeforeConfig: AsyncHook<BeforeConfigFn>;
  onAfterPrepare: AsyncHook<AfterPrepareFn>;
  deploy: AsyncHook<DeplpoyFn>;
  _internalRuntimePlugins: AsyncHook<InternalRuntimePluginsFn>;
  _internalServerPlugins: AsyncHook<InternalServerPluginsFn>;
  checkEntryPoint: AsyncHook<CheckEntryPointFn>;
  modifyEntrypoints: AsyncHook<ModifyEntrypointsFn>;
  modifyFileSystemRoutes: AsyncHook<ModifyFileSystemRoutesFn>;
  modifyServerRoutes: AsyncHook<ModifyServerRoutesFn>;
  generateEntryCode: AsyncHook<GenerateEntryCodeFn>;
  onBeforeGenerateRoutes: AsyncHook<BeforeGenerateRoutesFn>;
  /**
   * @deprecated
   */
  onBeforePrintInstructions: AsyncHook<BeforePrintInstructionsFn>;
  /**
   * @deprecated
   */
  registerDev: AsyncHook<RegisterDevFn>;
  /**
   * @deprecated
   */
  registerBuildPlatform: AsyncHook<RegisterBuildPlatformFn>;
  /**
   * @deprecated
   */
  addRuntimeExports: AsyncHook<AddRuntimeExportsFn>;
}

export type AppToolsExtendContext<B extends Bundler = 'webpack'> = {
  metaName: string;
  internalDirectory: string;
  sharedDirectory: string;
  internalDirAlias: string;
  internalSrcAlias: string;
  apiDirectory: string;
  lambdaDirectory: string;
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
};

export type AppToolsContext<B extends Bundler = 'webpack'> = AppContext<
  AppTools<B>
> &
  AppToolsExtendContext<B>;

export type AppToolsHooks<B extends Bundler = 'webpack'> = Hooks<
  AppToolsUserConfig<B>,
  AppToolsNormalizedConfig
> &
  AppToolsExtendHooks;
