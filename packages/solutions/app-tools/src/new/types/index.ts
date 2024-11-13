import type { DevToolData, RegisterBuildPlatformResult } from '@modern-js/core';
import type {
  CLIPluginAPI,
  PluginHookTap,
  TransformFunction,
} from '@modern-js/plugin-v2';
import type { AppContext } from '@modern-js/plugin-v2/dist/types';
import type {
  Entrypoint,
  NestedRouteForCli,
  PageRoute,
  RouteLegacy,
  ServerPlugin,
  ServerRoute,
} from '@modern-js/types';
import type {
  AppToolsNormalizedConfig,
  AppToolsUserConfig,
} from '../../types/config';
import type { RuntimePlugin } from '../../types/hooks';
import type { Bundler } from '../../types/utils';
import type { getHookRunners } from '../compat/hooks';

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
export type ModifyEntrypointsFn = TransformFunction<Entrypoint[]>;
export type ModifyFileSystemRoutesFn = TransformFunction<{
  entrypoint: Entrypoint;
  routes: RouteLegacy[] | (NestedRouteForCli | PageRoute)[];
}>;
export type ModifyServerRoutesFn = TransformFunction<{ routes: ServerRoute[] }>;
export type DeplpoyFn = () => Promise<void> | void;
export type GenerateEntryCodeFn = (
  entrypoints: Entrypoint[],
) => Promise<void> | void;
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

export interface AppToolsExtendAPI<B extends Bundler> {
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
  useAppContext: () => AppContext<
    AppToolsUserConfig<B>,
    AppToolsNormalizedConfig<AppToolsUserConfig<B>>
  >;
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
export interface AppTools<B extends Bundler>
  extends CLIPluginAPI<
      AppToolsUserConfig<B>,
      AppToolsNormalizedConfig<AppToolsUserConfig<B>>
    >,
    AppToolsExtendAPI<B> {}

export type AppToolsExtendAPIName<B extends Bundler> =
  keyof AppToolsExtendAPI<B> & string;
