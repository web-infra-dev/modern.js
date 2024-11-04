import { logger } from '@modern-js/utils';
import { program } from '@modern-js/utils/commander';
import type { CLIPlugin } from 'src/types';
import { createContext } from '../context';
import { initPluginAPI } from '../init';
import { createPluginManager } from '../manager';
import { createLoadedConfig } from './config/createLoadedConfig';
import type { CLIOptions } from './types';
import { initCommandsMap } from './utils.ts/commander';
import { initAppDir } from './utils.ts/initAppDir';
import { loadEnv } from './utils.ts/loadEnv';

export const createCli = <Config, NormalizedConfig>() => {
  const pluginManager = createPluginManager<Config, NormalizedConfig>();

  async function init(options: CLIOptions) {
    const {
      metaName = 'MODERN',
      command,
      configFile,
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
      ).plugins || [],
    );

    const plugins = await pluginManager.getPlugins();

    const context = await createContext<Config, NormalizedConfig>({
      appContext: {
        packageName: loaded.packageName,
        configFile: loaded.configFile,
        command: command!,
        isProd: process.env.NODE_ENV === 'production',
        appDirectory,
        plugins,
      },
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

    return { appContext: context };
  }
  async function run(options: CLIOptions) {
    const { appContext } = await init(options);
    await appContext.hooks.addCommand.call({ program });
    // await createFileWatcher(appContext, hooksRunner);
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
