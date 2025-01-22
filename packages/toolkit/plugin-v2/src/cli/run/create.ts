import { createDebugger, logger } from '@modern-js/utils';
import { program } from '@modern-js/utils/commander';
import { createPluginManager } from '../../manager';
import type { CLIPlugin, CLIPluginExtends } from '../../types/cli/plugin';
import type { Plugin } from '../../types/plugin';
import type { DeepPartial } from '../../types/utils';
import { initPluginAPI } from '../api';
import { createContext, initAppContext } from '../context';
import { createLoadedConfig } from './config/createLoadedConfig';
import { createResolveConfig } from './config/createResolvedConfig';
import type { CLIRunOptions } from './types';
import { checkIsDuplicationPlugin } from './utils/checkIsDuplicationPlugin';
import { initCommandsMap, setProgramVersion } from './utils/commander';
import { createFileWatcher } from './utils/createFileWatcher';
import { initAppDir } from './utils/initAppDir';
import { loadEnv } from './utils/loadEnv';

const debug = createDebugger('plugin-v2');

export const createCli = <Extends extends CLIPluginExtends>() => {
  let initOptions: CLIRunOptions<Extends>;
  const pluginManager = createPluginManager();

  async function init(options: CLIRunOptions<Extends>) {
    pluginManager.clear();
    initOptions = options;
    const {
      metaName = 'MODERN',
      configFile,
      config,
      command,
      version,
      packageJsonConfig,
      internalPlugins,
      handleSetupResult,
    } = options;

    const appDirectory = await initAppDir(options?.cwd);

    initCommandsMap();

    setProgramVersion(version);

    loadEnv(appDirectory, process.env[`${metaName.toUpperCase()}_ENV`]);

    const loaded = await createLoadedConfig<Extends['config']>(
      appDirectory,
      configFile,
      packageJsonConfig,
      config,
    );

    const allPlugins = [
      ...(internalPlugins || []),
      ...((loaded.config as unknown as { plugins: Plugin[] }).plugins || []),
    ];
    checkIsDuplicationPlugin(
      allPlugins.map(plugin => plugin.name),
      (loaded.config as unknown as { autoLoadPlugins?: boolean })
        .autoLoadPlugins,
    );

    pluginManager.addPlugins(allPlugins);

    const plugins = (await pluginManager.getPlugins()) as CLIPlugin<Extends>[];

    debug(
      'CLI Plugins:',
      plugins.map(p => p.name),
    );

    const context = await createContext<Extends>({
      appContext: initAppContext<Extends>({
        packageName: loaded.packageName,
        configFile: loaded.configFile,
        command: command,
        appDirectory,
        plugins,
      }),
      config: loaded.config,
      normalizedConfig: {},
    });

    const pluginAPI = initPluginAPI<Extends>({
      context,
      pluginManager,
    });

    context.pluginAPI = pluginAPI;

    for (const plugin of plugins) {
      const setupResult = await plugin.setup?.(pluginAPI);
      if (handleSetupResult) {
        await handleSetupResult(setupResult, pluginAPI);
      }
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
      Extends['config'],
      Extends['normalizedConfig']
    >(loaded, extraConfigs as DeepPartial<Extends['config']>[]);

    const resolved =
      await context.hooks.modifyResolvedConfig.call(normalizedConfig);

    context.normalizedConfig = resolved || normalizedConfig;

    await pluginAPI.updateAppContext(context);

    await context.hooks.onPrepare.call();

    // compat old modernjs hook
    await (context.hooks as any)?.onAfterPrepare?.call();

    return { appContext: context };
  }
  async function run(options: CLIRunOptions<Extends>) {
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
    getPrevInitOptions: () => initOptions,
  };
};
