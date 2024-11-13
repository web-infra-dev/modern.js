import type { InternalContext, Plugin } from '@modern-js/plugin-v2';
import { createAsyncHook } from '@modern-js/plugin-v2';
import { appTools as oldAppTools } from '../old';
import type { AppToolsNormalizedConfig, AppToolsUserConfig } from '../types';
import { compatPlugin } from './compat';
import {
  DEFAULT_RUNTIME_CONFIG_FILE,
  DEFAULT_SERVER_CONFIG_FILE,
} from './constants';
import { initAppContext } from './context';
import type {
  AddRuntimeExportsFn,
  AfterPrepareFn,
  AppTools,
  AppToolsExtendAPIName,
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
    AppToolsExtendAPIName<'shared'>
  >
> => ({
  name: '@modern-js/plugin-app-tools',
  usePlugins: [compatPlugin(), oldAppTools(options) as any],
  post: ['@modern-js/app-tools-old'],
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
    const context = api.getAppContext();
    api.updateAppContext(
      initAppContext({
        appDirectory: context.appDirectory,
        options: {},
        serverConfigFile: DEFAULT_SERVER_CONFIG_FILE,
        runtimeConfigFile: DEFAULT_RUNTIME_CONFIG_FILE,
      }),
    );
  },
});
