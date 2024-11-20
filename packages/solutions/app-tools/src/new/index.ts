import path from 'path';
import { getLocaleLanguage } from '@modern-js/plugin-i18n/language-detector';
import { createAsyncHook } from '@modern-js/plugin-v2';
import type { InternalContext, Plugin } from '@modern-js/plugin-v2/types';
import { castArray } from '@modern-js/uni-builder';
import {
  cleanRequireCache,
  deprecatedCommands,
  emptyDir,
  getArgv,
  getCommand,
} from '@modern-js/utils';
import {
  buildCommand,
  deployCommand,
  devCommand,
  inspectCommand,
  newCommand,
  serverCommand,
  upgradeCommand,
} from '../commands';
import { i18n } from '../locale';
import analyzePlugin from '../plugins/analyze';
import deployPlugin from '../plugins/deploy';
import initializePlugin from '../plugins/initialize';
import serverBuildPlugin from '../plugins/serverBuild';
import type {
  AppToolsNormalizedConfig,
  AppToolsOptions,
  AppToolsUserConfig,
} from '../types';
import { generateWatchFiles } from '../utils/generateWatchFiles';
import { restart } from '../utils/restart';
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
export { initAppContext };

export type AppToolsPlugin = Plugin<
  AppTools<'shared'>,
  InternalContext<
    AppToolsUserConfig<'shared'>,
    AppToolsNormalizedConfig,
    AppToolsExtendAPIName<'shared'>
  >
>;

export const appTools = (
  options: AppToolsOptions = {
    // default webpack to be compatible with original projects
    bundler: 'webpack',
  },
): AppToolsPlugin => ({
  name: '@modern-js/app-tools',
  usePlugins: [
    compatPlugin(),
    initializePlugin({
      bundler:
        options?.bundler &&
        ['rspack', 'experimental-rspack'].includes(options.bundler)
          ? 'rspack'
          : 'webpack',
    }) as any,
    analyzePlugin({
      bundler:
        options?.bundler &&
        ['rspack', 'experimental-rspack'].includes(options.bundler)
          ? 'rspack'
          : 'webpack',
    }),
    serverBuildPlugin(),
    deployPlugin(),
  ],
  post: [
    '@modern-js/plugin-initialize',
    '@modern-js/plugin-analyze',
    '@modern-js/plugin-ssr',
    '@modern-js/plugin-document',
    '@modern-js/plugin-state',
    '@modern-js/plugin-router',
    '@modern-js/plugin-router-v5',
    '@modern-js/plugin-polyfill',
  ],
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
    const locale = getLocaleLanguage();
    i18n.changeLanguage({ locale });
    const context = api.getAppContext();
    const userConfig = api.getConfig();
    api.updateAppContext(
      initAppContext({
        appDirectory: context.appDirectory,
        options: {},
        serverConfigFile: DEFAULT_SERVER_CONFIG_FILE,
        runtimeConfigFile: DEFAULT_RUNTIME_CONFIG_FILE,
        tempDir: userConfig.output?.tempDir,
      }),
    );

    api.onBeforeConfig(() => {
      const userConfig = api.getConfig();
      const appContext = api.getAppContext();
      if (userConfig.output?.tempDir) {
        api.updateAppContext({
          internalDirectory: path.resolve(
            appContext.appDirectory,
            userConfig.output.tempDir,
          ),
        });
      }
    });

    api.addCommand(async ({ program }) => {
      await devCommand(program, api);
      await buildCommand(program, api);
      serverCommand(program, api);
      deployCommand(program, api);
      newCommand(program, locale);
      inspectCommand(program, api);
      upgradeCommand(program);
      deprecatedCommands(program);
    });

    api.onPrepare(async () => {
      const command = getCommand();
      if (command === 'deploy') {
        const isSkipBuild = ['-s', '--skip-build'].some(tag => {
          return getArgv().includes(tag);
        });
        // if skip build, do not clean dist path
        if (isSkipBuild) {
          return;
        }
      }

      // clean dist path before building
      if (
        command === 'dev' ||
        command === 'start' ||
        command === 'build' ||
        command === 'deploy'
      ) {
        const resolvedConfig = api.getNormalizedConfig();
        if (resolvedConfig.output.cleanDistPath) {
          const appContext = api.getAppContext();
          await emptyDir(appContext.distDirectory!);
        }
      }
    });

    api.onWatchFiles(async () => {
      const appContext = api.getAppContext();
      const config = api.getNormalizedConfig();
      const files = await generateWatchFiles(
        appContext,
        config.source.configDir,
      );

      const watchFiles = castArray(config.dev.watchFiles);
      watchFiles.forEach(({ type, paths }) => {
        if (type === 'reload-server') {
          files.push(...(Array.isArray(paths) ? paths : [paths]));
        }
      });

      return files;
    });

    api.onFileChanged(
      async (e: {
        filename: string;
        eventType: string;
        isPrivate: boolean;
      }) => {
        const { filename, eventType, isPrivate } = e;

        if (!isPrivate && (eventType === 'change' || eventType === 'unlink')) {
          const { closeServer } = await import('../utils/createServer.js');
          await closeServer();
          await restart(api, filename);
        }
      },
    );

    api.onBeforeRestart(() => {
      cleanRequireCache([require.resolve('./plugins/analyze')]);
    });
  },
});
