import { logger } from '@modern-js/utils';
import { program } from '@modern-js/utils/commander';
import type { CLIPlugin } from 'src/types';
import { createContext, initAppContext } from '../context';
import { initPluginAPI } from '../init';
import { createPluginManager } from '../manager';
import { createLoadedConfig } from './config/createLoadedConfig';
import { createResolveConfig } from './config/createResolvedConfig';
import type { CLIRunOptions } from './types';
import { initCommandsMap } from './utils/commander';
import { createFileWatcher } from './utils/createFileWatcher';
import { initAppDir } from './utils/initAppDir';
import { loadEnv } from './utils/loadEnv';

export const createCli = <Config, NormalizedConfig>() => {
  const pluginManager = createPluginManager<Config, NormalizedConfig>();

  async function init(options: CLIRunOptions) {
    const {
      metaName = 'MODERN',
      configFile,
      command,
      packageJsonConfig,
    } = options;

    const appDirectory = await initAppDir(options?.cwd);
    initCommandsMap();

    loadEnv(appDirectory, process.env[`${metaName.toUpperCase()}_ENV`]);

    const loaded = await createLoadedConfig<Config>(
      appDirectory,
      configFile,
      packageJsonConfig,
    );

    pluginManager.addPlugins(
      (
        loaded.config as unknown as {
          plugins: CLIPlugin<Config, NormalizedConfig>[];
        }
      )?.plugins || [],
    );

    const plugins = await pluginManager.getPlugins();

    const context = await createContext<Config, NormalizedConfig>({
      appContext: initAppContext({
        packageName: loaded.packageName,
        configFile: loaded.configFile,
        command: command,
        appDirectory,
        plugins,
      }),
      config: loaded.config,
      normalizedConfig: {} as NormalizedConfig,
    });

    const pluginAPI = initPluginAPI<Config, NormalizedConfig>({
      context,
      pluginManager,
    });

    context.pluginAPI = pluginAPI;

    for (const plugin of plugins) {
      await plugin.setup(pluginAPI);
    }

    ['SIGINT', 'SIGTERM', 'unhandledRejection', 'uncaughtException'].forEach(
      event => {
        process.on(event, async (err: unknown) => {
          await context.hooks.onBeforeExit.call();

          let hasError = false;

          if (err instanceof Error) {
            logger.error(err.stack);
            hasError = true;
          } else if (
            err &&
            (event === 'unhandledRejection' || event === 'uncaughtException')
          ) {
            // We should not pass it, if err is not instanceof Error.
            // We can use `console.trace` to follow it call stack,
            console.trace('Unknown Error', err);
            hasError = true;
          }

          process.nextTick(() => {
            process.exit(hasError ? 1 : 0);
          });
        });
      },
    );

    const extraConfigs = await context.hooks.config.call();

    const normalizedConfig = await createResolveConfig<
      Config,
      NormalizedConfig
    >(loaded, extraConfigs);

    const resolved =
      await context.hooks.modifyResolvedConfig.call(normalizedConfig);

    context.normalizedConfig = resolved[0];

    await context.hooks.onPrepare.call();

    return { appContext: context };
  }
  async function run(options: CLIRunOptions) {
    const { appContext } = await init(options);
    await appContext.hooks.addCommand.call({ program });

    await createFileWatcher(appContext);

    program.parse(process.argv);
    if (!program.commands?.length) {
      logger.warn(
        'No command found, please make sure you have registered plugins correctly.',
      );
    }
  }
  return {
    init,
    run,
  };
};
