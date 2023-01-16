import path from 'path';
import {
  pkgUp,
  program,
  logger,
  DEFAULT_SERVER_CONFIG,
  INTERNAL_SERVER_PLUGINS,
  Command,
} from '@modern-js/utils';
import type { ErrorObject } from '@modern-js/utils/ajv';
import { InternalPlugins } from '@modern-js/types';
import { initCommandsMap } from './utils/commander';
import { loadPlugins, TransformPlugin } from './loadPlugins';
import {
  AppContext,
  ConfigContext,
  initAppContext,
  ResolvedConfigContext,
  useAppContext,
} from './context';
import { loadEnv } from './loadEnv';
import { manager } from './manager';
import type { CliHooksRunner } from './types/hooks';
import type { ToolsType } from './types';
import { createResolveConfig, createLoadedConfig } from './config';

export * from './types';

export * from '@modern-js/plugin';

// TODO: remove export after refactor all plugins
export { manager, mountHook, createPlugin, registerHook } from './manager';

export {
  AppContext,
  ConfigContext,
  ResolvedConfigContext,
  useAppContext,
  useConfigContext,
  useResolvedConfigContext,
} from './context';

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
  cwd?: string;
  version?: string;
  configFile?: string;
  serverConfigFile?: string;
  packageJsonConfig?: string;
  internalPlugins?: {
    cli?: InternalPlugins;
    server?: InternalPlugins;
    autoLoad?: InternalPlugins;
  };
  transformPlugin?: TransformPlugin;
  onSchemaError?: (error: ErrorObject) => void;
  options?: {
    metaName?: string;
    srcDir?: string;
    distDir?: string;
    sharedDir?: string;
  };
  toolsType?: ToolsType;

  /** force the modern-js core auto register plugin exist in the package.json  */
  forceAutoLoadPlugins?: boolean;
}

export const mergeOptions = (options?: CoreOptions) => {
  const defaultOptions = {
    serverConfigFile: DEFAULT_SERVER_CONFIG,
  };

  return {
    ...defaultOptions,
    ...options,
  };
};

const setProgramVersion = (version = 'unknown') => {
  program.name('modern').usage('<command> [options]').version(version);
};

const createCli = () => {
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
    );

    const plugins = await loadPlugins(appDirectory, loaded.config, {
      internalPlugins: mergedOptions?.internalPlugins?.cli,
      transformPlugin: mergedOptions?.transformPlugin,
      autoLoad: mergedOptions?.internalPlugins?.autoLoad,
      forceAutoLoadPlugins: mergedOptions?.forceAutoLoadPlugins,
    });

    plugins.forEach(plugin => plugin && manager.usePlugin(plugin));

    const appContext = initAppContext({
      toolsType: mergedOptions?.toolsType,
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

    await hooksRunner.addRuntimeExports();

    await hooksRunner.prepare();

    await hooksRunner.afterPrepare();

    return {
      resolved,
      appContext: useAppContext(),
    };
  };

  async function run(options?: CoreOptions) {
    await init(options);

    await hooksRunner.commands({ program });
    program.parse(process.argv);
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
    getPrevInitOptions: () => initOptions,
  };
};

export const cli = createCli();

export { initAppDir, initAppContext };

declare module '@modern-js/utils/compiled/commander' {
  export interface Command {
    commandsMap: Map<string, Command>;
  }
}
