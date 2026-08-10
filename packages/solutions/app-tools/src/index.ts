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
  infoCommand,
  inspectCommand,
  serverCommand,
} from './commands';
import { compatPlugin } from './compat';
import { DEFAULT_RUNTIME_CONFIG_FILE } from './constants';
import { i18n } from './locale';
import analyzePlugin from './plugins/analyze';
import deployPlugin from './plugins/deploy';
import devLockPlugin from './plugins/devLock';
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
  ModifyBuilderEnvironmentsFn,
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
    // Must stay first: its `onPrepare` checks the project operation lock
    // before any plugin cleans `internalDirectory` or `dist`.
    devLockPlugin(),
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
    modifyBuilderEnvironments: createAsyncHook<ModifyBuilderEnvironmentsFn>(),
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
      inspectCommand(program, api);
      infoCommand(program, api);
      deprecatedCommands(program);
    });

    api.onPrepare(async () => {
      const command = getCommand();

      // CLI `deploy --skip-build` reuses the previous build output, so it must
      // not clean dist.
      if (command === 'deploy') {
        const isSkipBuild = ['-s', '--skip-build'].some(tag => {
          return getArgv().includes(tag);
        });
        if (isSkipBuild) {
          return;
        }
      }

      // Clean dist before the build output is generated. This must run here in
      // `onPrepare` (before the analyze plugin's `generateEntryCode`, which
      // writes `nestedRoutes.json` into dist), NOT in the `build`/`dev`
      // commands which run afterwards and would delete it.
      //
      // Recognize both the CLI argv command and the programmatic
      // `appContext.command`. `deploy` is intentionally excluded from the
      // programmatic fallback: a programmatic `deploy({ skipBuild: true })`
      // opts out only when `deploy()` runs (after this hook), so cleaning here
      // could wipe the dist it means to reuse. Programmatic `deploy` dist
      // cleanup is a known limitation tracked separately.
      const { command: contextCommand } = api.getAppContext();
      const shouldClean =
        ['dev', 'start', 'build', 'deploy'].includes(command) ||
        ['dev', 'start', 'build'].includes(contextCommand);

      if (shouldClean) {
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

export { build } from './commands/build';
export { deploy } from './commands/deploy';
export { dev } from './commands/dev';
export { serve } from './commands/serve';
export { closeServer } from './utils/createServer';
export type { BuildOptions, DeployOptions, DevOptions } from './utils/types';
export { generateWatchFiles } from './utils/generateWatchFiles';
export {
  resolveModernRsbuildConfig,
  type ResolveModernRsbuildConfigOptions,
} from './rsbuild';

export * from './types';

export { initAppContext };

export default appTools;

// TODO: check mergeConfig is equal to @modern-js/core
export { mergeConfig } from '@modern-js/plugin/cli';
