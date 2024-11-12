import type { InternalContext, Plugin } from '@modern-js/plugin-v2';
import { createAsyncHook } from '@modern-js/plugin-v2';
import type { AppToolsNormalizedConfig, AppToolsUserConfig } from '../types';
import { compatPlugin } from './compat';
import type {
  AppTools,
  CheckEntryPointFn,
  DeplpoyFn,
  InternalRuntimePluginsFn,
  InternalServerPluginsFn,
  ModifyEntrypointsFn,
  ModifyFileSystemRoutesFn,
  ModifyServerRoutesFn,
} from './types';

export * from '../defineConfig';

export type AppToolsOptions = {
  /**
   * Specify which bundler to use for the build.
   * @default `webpack`
   * */
  bundler?: 'rspack' | 'webpack' | 'experimental-rspack';
};

export const appTools = (
  options: AppToolsOptions = {
    // default webpack to be compatible with original projects
    bundler: 'webpack',
  },
): Plugin<
  AppTools<'shared'>,
  InternalContext<AppToolsUserConfig<'shared'>, AppToolsNormalizedConfig>
> => ({
  name: '@modern-js/plugin-app-tools',
  usePlugins: [compatPlugin()],
  registryHooks: {
    _internalRuntimePlugins: createAsyncHook<InternalRuntimePluginsFn>(),
    _internalServerPlugins: createAsyncHook<InternalServerPluginsFn>(),
    checkEntryPoint: createAsyncHook<CheckEntryPointFn>(),
    modifyEntrypoints: createAsyncHook<ModifyEntrypointsFn>(),
    modifyFileSystemRoutes: createAsyncHook<ModifyFileSystemRoutesFn>(),
    modifyServerRoutes: createAsyncHook<ModifyServerRoutesFn>(),
    deploy: createAsyncHook<DeplpoyFn>(),
  },
  setup: api => {
    api.onPrepare(() => {
      console.log('app-tools prepare', options);
      api.updateAppContext({ command: 'test' });
      const context = api.getAppContext();
      console.log('app-tools', context);
    });
  },
});
