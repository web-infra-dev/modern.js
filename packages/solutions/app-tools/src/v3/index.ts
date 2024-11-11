import type { Plugin } from '@modern-js/plugin-v2';
import { createAsyncHook } from '@modern-js/plugin-v2';
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

const testPlugin = (): Plugin<AppTools<'shared'>> => {
  return {
    name: 'test-plugin',
    setup: api => {
      api.checkEntryPoint(({ path, entry }) => {
        console.log('checkEntryPoint');
        return { path, entry };
      });
    },
  };
};

export const appTools = (
  options: AppToolsOptions = {
    // default webpack to be compatible with original projects
    bundler: 'webpack',
  },
): Plugin<AppTools<'shared'>> => ({
  name: '@modern-js/plugin-app-tools',
  usePlugins: [testPlugin()],
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
      const hooks = api.getHooks();
      hooks.checkEntryPoint.call({ path: '', entry: '' });
      console.log('app-tools prepare', options);
    });
  },
});
