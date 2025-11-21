import path from 'path';
import { castArray } from '@modern-js/builder';
import { getLocaleLanguage } from '@modern-js/i18n-utils/language-detector';
import { createAsyncHook } from '@modern-js/plugin';
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
} from './commands';
import { compatPlugin } from './compat';
import { DEFAULT_RUNTIME_CONFIG_FILE } from './constants';
import { i18n } from './locale';
import analyzePlugin from './plugins/analyze';
import deployPlugin from './plugins/deploy';
import initializePlugin from './plugins/initialize';
import serverBuildPlugin from './plugins/serverBuild';
import serverRuntimePlugin from './plugins/serverRuntime';
import type { AppTools, CliPlugin } from './types';
import type {
  AddRuntimeExportsFn,
  AfterPrepareFn,
  BeforeGenerateRoutesFn,
  BeforePrintInstructionsFn,
  CheckEntryPointFn,
  DeplpoyFn,
  GenerateEntryCodeFn,
  ModifyEntrypointsFn,
  ModifyFileSystemRoutesFn,
} from './types/plugin';
import { generateWatchFiles } from './utils/generateWatchFiles';
import { initAppContext } from './utils/initAppContext';
import { restart } from './utils/restart';

export * from './defineConfig';

export const appTools = (): CliPlugin<AppTools> => ({
  name: '@modern-js/app-tools',
  usePlugins: [
    serverRuntimePlugin(),
    compatPlugin(),
    initializePlugin(),
    analyzePlugin(),
    serverBuildPlugin(),
    deployPlugin(),
  ],
  post: [
    '@modern-js/plugin-initialize',
    '@modern-js/plugin-analyze',
    '@modern-js/plugin-ssr',
    '@modern-js/plugin-document',
    '@modern-js/plugin-router',
    '@modern-js/plugin-polyfill',
  ],
  registryHooks: {
    onAfterPrepare: createAsyncHook<AfterPrepareFn>(),
    deploy: createAsyncHook<DeplpoyFn>(),
    checkEntryPoint: createAsyncHook<CheckEntryPointFn>(),
    modifyEntrypoints: createAsyncHook<ModifyEntrypointsFn>(),
    modifyFileSystemRoutes: createAsyncHook<ModifyFileSystemRoutesFn>(),
    generateEntryCode: createAsyncHook<GenerateEntryCodeFn>(),
    onBeforeGenerateRoutes: createAsyncHook<BeforeGenerateRoutesFn>(),
    onBeforePrintInstructions: createAsyncHook<BeforePrintInstructionsFn>(),
  },
  setup: api => {
    const context = api.getAppContext();
    const userConfig = api.getConfig();
    const locale = getLocaleLanguage();
    i18n.changeLanguage({ locale });
    api.updateAppContext(
      initAppContext({
        metaName: context.metaName,
        appDirectory: context.appDirectory,
        runtimeConfigFile: DEFAULT_RUNTIME_CONFIG_FILE,
        tempDir: userConfig.output?.tempDir,
      }),
    );

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
          await emptyDir(appContext.distDirectory);
        }
      }
    });

    api.addWatchFiles(async () => {
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

    api.onFileChanged(async e => {
      const { filename, eventType, isPrivate } = e;

      const { appDirectory, apiDirectory } = api.getAppContext();
      const relativeApiPath = path.relative(appDirectory, apiDirectory);
      const isApiProject = filename.startsWith(`${relativeApiPath}/`);

      if (
        !isPrivate &&
        (eventType === 'change' || eventType === 'unlink') &&
        !isApiProject
      ) {
        const { closeServer } = await import('./utils/createServer.js');
        await closeServer();
        await restart(api.getHooks(), filename);
      }
    });

    api.onBeforeRestart(() => {
      cleanRequireCache([require.resolve('./plugins/analyze')]);
    });
  },
});

export { defineConfig } from './defineConfig';
export type { RuntimeUserConfig } from './types/config';

export { dev } from './commands/dev';
export { serve } from './commands/serve';
export type { DevOptions } from './utils/types';
export { generateWatchFiles } from './utils/generateWatchFiles';

export * from './types';

export { initAppContext };

export default appTools;

// TODO: check mergeConfig is equal to @modern-js/core
export { mergeConfig } from '@modern-js/plugin/cli';
