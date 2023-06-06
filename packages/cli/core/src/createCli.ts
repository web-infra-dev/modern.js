import {
  logger,
  program,
  Command,
  DEFAULT_SERVER_CONFIG,
  INTERNAL_SERVER_PLUGINS,
} from '@modern-js/utils';
import { initAppDir, initCommandsMap, createFileWatcher } from './utils';
import { loadPlugins } from './loadPlugins';
import {
  AppContext,
  ConfigContext,
  initAppContext,
  ResolvedConfigContext,
  useAppContext,
} from './context';
import { loadEnv } from './loadEnv';
import { manager } from './manager';
import type { CliHooksRunner, CoreOptions } from './types';
import { createResolveConfig, createLoadedConfig } from './config';
import { checkIsDuplicationPlugin } from './utils/checkIsDuplicationPlugin';

const setProgramVersion = (version = 'unknown') => {
  program.name('modern').usage('<command> [options]').version(version);
};

export const mergeOptions = (
  options?: CoreOptions,
): CoreOptions & {
  serverConfigFile: string;
} => {
  const defaultOptions = {
    serverConfigFile: DEFAULT_SERVER_CONFIG,
  };

  return {
    ...defaultOptions,
    ...options,
  };
};

export const createCli = () => {
  let hooksRunner: CliHooksRunner;
  let initOptions: CoreOptions | undefined;

  const init = async (options?: CoreOptions) => {
    manager.clear();

    const mergedOptions = mergeOptions(options);

    initOptions = mergedOptions;

    const appDirectory = await initAppDir(options?.cwd);

    initCommandsMap();
    setProgramVersion(options?.version);

    const metaName = mergedOptions?.options?.metaName ?? 'MODERN';
    loadEnv(appDirectory, process.env[`${metaName.toUpperCase()}_ENV`]);

    const loaded = await createLoadedConfig(
      appDirectory,
      mergedOptions?.configFile,
      mergedOptions?.packageJsonConfig,
      mergedOptions?.loadedConfig,
    );

    const plugins = await loadPlugins(appDirectory, loaded.config, {
      internalPlugins: mergedOptions?.internalPlugins?.cli,
      autoLoad: mergedOptions?.internalPlugins?.autoLoad,
      forceAutoLoadPlugins: mergedOptions?.forceAutoLoadPlugins,
    });

    checkIsDuplicationPlugin(
      plugins.map(plugin => plugin.name),
      loaded.config.autoLoadPlugins,
    );

    plugins.forEach(plugin => plugin && manager.usePlugin(plugin));

    const appContext = initAppContext({
      appDirectory,
      plugins,
      configFile: loaded.filePath,
      options: mergedOptions?.options,
      serverConfigFile: mergedOptions?.serverConfigFile,
      serverInternalPlugins:
        mergedOptions?.internalPlugins?.server || INTERNAL_SERVER_PLUGINS,
    });

    ConfigContext.set(loaded.config);
    AppContext.set(appContext);

    hooksRunner = await manager.init();

    ['SIGINT', 'SIGTERM', 'unhandledRejection', 'uncaughtException'].forEach(
      event => {
        process.on(event, async err => {
          hooksRunner.beforeExit();
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

    await hooksRunner.beforeConfig();

    const extraConfigs = await hooksRunner.config();

    const extraSchemas = await hooksRunner.validateSchema();

    const normalizedConfig = await createResolveConfig(
      loaded,
      extraConfigs,
      extraSchemas,
      options?.onSchemaError,
    );

    const { resolved } = await hooksRunner.resolvedConfig({
      resolved: normalizedConfig,
    });

    // update context value
    ConfigContext.set(loaded.config);
    ResolvedConfigContext.set(resolved);

    await hooksRunner.prepare();

    await hooksRunner.afterPrepare();

    return {
      resolved,
      appContext: useAppContext(),
    };
  };

  async function run(options?: CoreOptions) {
    const { appContext } = await init(options);

    await hooksRunner.commands({ program });

    await createFileWatcher(appContext, hooksRunner);

    program.parse(process.argv);

    if (!program.commands?.length) {
      logger.warn(
        'No command found, please make sure you have registered plugins correctly.',
      );
    }
  }

  async function runCommand(
    command: string,
    commandOptions: string[] = [],
    options?: CoreOptions,
  ) {
    const argv = process.argv
      .slice(0, 2)
      .concat(command)
      .concat(commandOptions);

    process.env.MODERN_ARGV = argv.join(' ');
    const { appContext } = await init(options);
    await hooksRunner.commands({ program });
    await createFileWatcher(appContext, hooksRunner);
    program.parse(argv);
  }

  async function test(
    argv: string[],
    options?: {
      coreOptions?: CoreOptions;
      disableWatcher?: boolean;
    },
  ) {
    const newProgram = new Command();
    const { coreOptions } = options ?? {};
    await init(coreOptions);

    await hooksRunner.commands({ program: newProgram });
    await newProgram.parseAsync(argv);
  }

  return {
    init,
    run,
    test,
    runCommand,
    getPrevInitOptions: () => initOptions,
  };
};
