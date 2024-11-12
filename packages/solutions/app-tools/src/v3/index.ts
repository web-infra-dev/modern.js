import type { InternalContext, Plugin } from '@modern-js/plugin-v2';
import { createAsyncHook } from '@modern-js/plugin-v2';
import type { AppToolsNormalizedConfig, AppToolsUserConfig } from '../types';
import { compatPlugin } from './compat';
import type { getHookRunners } from './compat/hooks';
import type {
  AddRuntimeExportsFn,
  AfterPrepareFn,
  AppTools,
  BeforeConfigFn,
  BeforeGenerateRoutesFn,
  BeforePrintInstructionsFn,
  CheckEntryPointFn,
  DeplpoyFn,
  GenerateEntryCodeFn,
  InternalRuntimePluginsFn,
  InternalServerPluginsFn,
  ModifyEntrypointsFn,
  ModifyFileSystemRoutesFn,
  ModifyServerRoutesFn,
  RegisterBuildPlatformFn,
  RegisterDevFn,
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
  InternalContext<
    AppToolsUserConfig<'shared'>,
    AppToolsNormalizedConfig,
    keyof ReturnType<typeof getHookRunners>
  >
> => ({
  name: '@modern-js/plugin-app-tools',
  usePlugins: [compatPlugin()],
  registryHooks: {
    onBeforeConfig: createAsyncHook<BeforeConfigFn>(),
    onAfterPrepare: createAsyncHook<AfterPrepareFn>(),
    deploy: createAsyncHook<DeplpoyFn>(),
    _internalRuntimePlugins: createAsyncHook<InternalRuntimePluginsFn>(),
    _internalServerPlugins: createAsyncHook<InternalServerPluginsFn>(),
    checkEntryPoint: createAsyncHook<CheckEntryPointFn>(),
    modifyEntrypoints: createAsyncHook<ModifyEntrypointsFn>(),
    modifyFileSystemRoutes: createAsyncHook<ModifyFileSystemRoutesFn>(),
    modifyServerRoutes: createAsyncHook<ModifyServerRoutesFn>(),
    generateEntryCode: createAsyncHook<GenerateEntryCodeFn>(),
    onBeforeGenerateRoutes: createAsyncHook<BeforeGenerateRoutesFn>(),
    onBeforePrintInstructions: createAsyncHook<BeforePrintInstructionsFn>(),
    registerDev: createAsyncHook<RegisterDevFn>(),
    registerBuildPlatform: createAsyncHook<RegisterBuildPlatformFn>(),
    addRuntimeExports: createAsyncHook<AddRuntimeExportsFn>(),
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
