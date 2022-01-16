import path from 'path';
import {
  compatRequire,
  pkgUp,
  ensureAbsolutePath,
  logger,
  INTERNAL_PLUGINS,
} from '@modern-js/utils';
import {
  createAsyncManager,
  createAsyncWorkflow,
  createParallelWorkflow,
  ParallelWorkflow,
  AsyncWorkflow,
  Progresses2Runners,
  createAsyncWaterfall,
  AsyncWaterfall,
} from '@modern-js/plugin';
import { enable } from '@modern-js/plugin/node';

import type { Hooks } from '@modern-js/types';
import { program, Command } from './utils/commander';
import {
  resolveConfig,
  defineConfig,
  loadUserConfig,
  UserConfig,
  ToolsConfig,
} from './config';
import { loadPlugins } from './loadPlugins';
import {
  AppContext,
  ConfigContext,
  IAppContext,
  initAppContext,
  ResolvedConfigContext,
  useAppContext,
  useConfigContext,
  useResolvedConfigContext,
} from './context';
import { initWatcher } from './initWatcher';
import { NormalizedConfig } from './config/mergeConfig';
import { loadEnv } from './loadEnv';

export type { Hooks };
export { defaultsConfig, mergeConfig } from './config';

export * from '@modern-js/plugin';
export * from '@modern-js/plugin/node';

program
  .name('modern')
  .usage('<command> [options]')
  .version(process.env.MODERN_JS_VERSION || '0.1.0');

export type HooksRunner = Progresses2Runners<{
  config: ParallelWorkflow<void>;
  resolvedConfig: AsyncWaterfall<{
    resolved: NormalizedConfig;
  }>;
  validateSchema: ParallelWorkflow<void>;
  prepare: AsyncWorkflow<void, void>;
  commands: AsyncWorkflow<
    {
      program: Command;
    },
    void
  >;
  watchFiles: ParallelWorkflow<void>;
  fileChange: AsyncWorkflow<
    {
      filename: string;
    },
    void
  >;
  beforeExit: AsyncWorkflow<void, void>;
}>;

const hooksMap = {
  config: createParallelWorkflow(),
  resolvedConfig: createAsyncWaterfall<{
    resolved: NormalizedConfig;
  }>(),
  validateSchema: createParallelWorkflow(),
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  prepare: createAsyncWorkflow<void, void>(),
  commands: createAsyncWorkflow<
    {
      program: Command;
    },
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    void
  >(),
  watchFiles: createParallelWorkflow(),
  fileChange: createAsyncWorkflow<
    {
      filename: string;
    },
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    void
  >(),
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  beforeExit: createAsyncWorkflow<void, void>(),
};

export const manager = createAsyncManager<Hooks, typeof hooksMap>(hooksMap);

export const {
  createPlugin,
  registe: registerHook,
  useRunner: mountHook,
} = manager;

export const usePlugins = (plugins: string[]) =>
  plugins.forEach(plugin =>
    manager.usePlugin(compatRequire(require.resolve(plugin))),
  );

export {
  defineConfig,
  AppContext,
  ResolvedConfigContext,
  useAppContext,
  useConfigContext,
  useResolvedConfigContext,
  ConfigContext,
};

export type { NormalizedConfig, IAppContext, UserConfig, ToolsConfig };

const initAppDir = async (cwd?: string): Promise<string> => {
  if (!cwd) {
    // eslint-disable-next-line no-param-reassign
    cwd = process.cwd();
  }
  const pkg = await pkgUp({ cwd });

  if (!pkg) {
    throw new Error(`no package.json found in current work dir: ${cwd}`);
  }

  return path.dirname(pkg);
};

export interface CoreOptions {
  configFile?: string;
  packageJsonConfig?: string;
  plugins?: typeof INTERNAL_PLUGINS;
  beforeUsePlugins?: (
    plugins: any,
    config: any,
  ) => { cli: any; cliPath: any; server: any; serverPath: any }[];
}

const createCli = () => {
  let hooksRunner: HooksRunner;
  let isRestart = false;

  const init = async (argv: string[] = [], options?: CoreOptions) => {
    enable();

    manager.clear();

    const appDirectory = await initAppDir();

    loadEnv(appDirectory);

    const loaded = await loadUserConfig(
      appDirectory,
      options?.configFile,
      options?.packageJsonConfig,
    );

    let plugins = loadPlugins(
      appDirectory,
      loaded.config.plugins || [],
      options?.plugins,
    );

    if (options?.beforeUsePlugins) {
      plugins = options.beforeUsePlugins(plugins, loaded.config);
    }

    plugins.forEach(plugin => plugin.cli && manager.usePlugin(plugin.cli));

    const appContext = initAppContext(appDirectory, plugins, loaded.filePath);

    manager.run(() => {
      ConfigContext.set(loaded.config);
      AppContext.set(appContext);
    });

    hooksRunner = await manager.init();

    ['SIGINT', 'SIGTERM', 'unhandledRejection', 'uncaughtException'].forEach(
      event => {
        process.on(event, async err => {
          await hooksRunner.beforeExit();
          if (err instanceof Error) {
            logger.error(err.stack);
          }
          process.nextTick(() => {
            // eslint-disable-next-line no-process-exit
            process.exit(1);
          });
        });
      },
    );

    const extraConfigs = await hooksRunner.config();

    const extraSchemas = await hooksRunner.validateSchema();

    const config = await resolveConfig(
      loaded,
      extraConfigs as any,
      extraSchemas as any,
      isRestart,
      argv,
    );

    const { resolved } = await hooksRunner.resolvedConfig({
      resolved: config,
    });

    // update context value
    manager.run(() => {
      ConfigContext.set(loaded.config);
      ResolvedConfigContext.set(resolved);
      AppContext.set({
        ...appContext,
        port: resolved.server.port!,
        distDirectory: ensureAbsolutePath(appDirectory, resolved.output.path!),
      });
    });

    await hooksRunner.prepare();

    return { loadedConfig: loaded, appContext, resolved };
  };

  async function run(argv: string[], options?: CoreOptions) {
    const { loadedConfig, appContext, resolved } = await init(argv, options);

    await hooksRunner.commands({ program });

    initWatcher(
      loadedConfig,
      appContext.appDirectory,
      resolved.source.configDir,
      hooksRunner,
      argv,
    );
    manager.run(() => program.parse(process.argv));
  }

  async function restart() {
    isRestart = true;

    logger.info('Restart...\n');

    let hasGetError = false;
    try {
      await init(process.argv.slice(2));
    } catch (err) {
      console.error(err);
      hasGetError = true;
    } finally {
      if (!hasGetError) {
        manager.run(() => program.parse(process.argv));
      }
    }
  }

  return {
    init,
    run,
    restart,
  };
};

export const cli = createCli();

export { loadUserConfig, initAppDir, initAppContext };
