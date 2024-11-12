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

export interface AppTools<B extends Bundler>
  extends CLIPluginAPI<
    AppToolsUserConfig<B>,
    AppToolsNormalizedConfig<AppToolsUserConfig<B>>
  > {
  _internalRuntimePlugins: PluginHookTap<InternalRuntimePluginsFn>;
  _internalServerPlugins: PluginHookTap<InternalServerPluginsFn>;
  checkEntryPoint: PluginHookTap<CheckEntryPointFn>;
  modifyEntrypoints: PluginHookTap<ModifyEntrypointsFn>;
  modifyFileSystemRoutes: PluginHookTap<ModifyFileSystemRoutesFn>;
  modifyServerRoutes: PluginHookTap<ModifyServerRoutesFn>;

  deploy: PluginHookTap<DeplpoyFn>;

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
  useHookRunners: () => {};
}
