import { fs, logger, chalk, isSSR, clearConsole } from '@modern-js/utils';
import type { Configuration } from '@modern-js/webpack';
import type { PluginAPI } from '@modern-js/core';

import { createCompiler } from '../utils/createCompiler';
import { createServer } from '../utils/createServer';
import { generateRoutes } from '../utils/routes';
import { printInstructions } from '../utils/printInstructions';
import { DevOptions } from '../utils/types';
import { getSpecifiedEntries } from '../utils/getSpecifiedEntries';
import { buildServerConfig } from '../utils/config';

export const dev = async (api: PluginAPI, options: DevOptions) => {
  const appContext = api.useAppContext();
  const userConfig = api.useResolvedConfigContext();
  const hookRunners = api.useHookRunners();

  const {
    appDirectory,
    distDirectory,
    port,
    apiOnly,
    entrypoints,
    serverConfigFile,
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

  fs.emptyDirSync(distDirectory);

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
    const { getWebpackConfig, WebpackConfigTarget } = await import(
      '@modern-js/webpack'
    );
    const webpackConfigs = [
      isSSR(userConfig) &&
        getWebpackConfig(WebpackConfigTarget.NODE, appContext, userConfig),
      getWebpackConfig(WebpackConfigTarget.CLIENT, appContext, userConfig),
    ].filter(Boolean) as Configuration[];

    compiler = await createCompiler({
      api,
      webpackConfigs,
      userConfig,
      appContext,
    });
  }

  await generateRoutes(appContext);

  const app = await createServer({
    dev: {
      ...{
        client: {
          port: port!.toString(),
          logging: 'none',
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
    plugins: appContext.plugins
      .filter((p: any) => p.server)
      .map((p: any) => p.server),
  });

  app.listen(port, async (err: Error) => {
    if (err) {
      throw err;
    }

    if (apiOnly) {
      return printInstructions(hookRunners, appContext, userConfig);
    }

    clearConsole();
    return logger.log(chalk.cyan(`Starting the development server...`));
  });
};
