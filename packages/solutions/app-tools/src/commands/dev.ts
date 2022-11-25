import { logger } from '@modern-js/utils';
import { PluginAPI, ResolvedConfigContext } from '@modern-js/core';
import { printInstructions } from '../utils/printInstructions';
import { createServer, injectDataLoaderPlugin } from '../utils/createServer';
import { generateRoutes } from '../utils/routes';
import { DevOptions } from '../utils/types';
import { getSpecifiedEntries } from '../utils/getSpecifiedEntries';
import { buildServerConfig } from '../utils/config';
import type { AppHooks } from '../hooks';

export const dev = async (api: PluginAPI<AppHooks>, options: DevOptions) => {
  if (options.analyze) {
    // Builder will read this env var to enable bundle analyzer
    process.env.BUNDLE_ANALYZE = 'true';
  }

  let userConfig = api.useResolvedConfigContext();
  const appContext = api.useAppContext();
  const hookRunners = api.useHookRunners();

  userConfig = { ...userConfig, cliOptions: options };
  ResolvedConfigContext.set(userConfig);

  const {
    appDirectory,
    distDirectory,
    port,
    apiOnly,
    entrypoints,
    serverConfigFile,
    serverInternalPlugins,
  } = appContext;
  const checkedEntries = await getSpecifiedEntries(
    options.entry || false,
    entrypoints,
  );

  api.setAppContext({
    ...appContext,
    checkedEntries,
  });
  appContext.checkedEntries = checkedEntries;

  await buildServerConfig({
    appDirectory,
    distDirectory,
    configFile: serverConfigFile,
    options: {
      esbuildOptions: {
        watch: true,
      },
    },
  });

  await hookRunners.beforeDev();

  let compiler = null;

  if (!apiOnly) {
    compiler = await appContext.builder?.createCompiler();
  }

  await generateRoutes(appContext);

  const app = await createServer({
    dev: {
      ...{
        client: {
          port: port!.toString(),
        },
        devMiddleware: {
          writeToDisk: (file: string) => !file.includes('.hot-update.'),
        },
        hot: true,
        liveReload: true,
        port,
        https: userConfig.dev.https,
      },
      ...userConfig.tools.devServer,
    },
    compiler,
    pwd: appDirectory,
    config: userConfig,
    serverConfigFile,
    internalPlugins: injectDataLoaderPlugin(serverInternalPlugins),
  });

  app.listen(port, async (err: Error) => {
    if (err) {
      throw err;
    }

    if (!apiOnly) {
      logger.info(`Starting dev server...\n`);
    } else {
      printInstructions(hookRunners, appContext, userConfig);
    }
  });
};
