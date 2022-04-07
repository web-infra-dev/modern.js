import type { Configuration } from '@modern-js/webpack';
import {
  fs,
  logger,
  HMR_SOCK_PATH,
  clearConsole,
  chalk,
  isSSR,
} from '@modern-js/utils';
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
    existSrc,
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

  await buildServerConfig(appDirectory, serverConfigFile, {
    esbuildOptions: {
      watch: true,
    },
  });

  await hookRunners.beforeDev();

  let compiler = null;
  if (existSrc) {
    const { getWebpackConfig, WebpackConfigTarget } = await import(
      '@modern-js/webpack'
    );
    const webpackConfigs = [
      isSSR(userConfig) && getWebpackConfig(WebpackConfigTarget.NODE),
      getWebpackConfig(WebpackConfigTarget.CLIENT),
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
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          port: port!.toString(),
          overlay: false,
          logging: 'none',
          path: HMR_SOCK_PATH,
          host: 'localhost',
        },
        dev: { writeToDisk: (file: string) => !file.includes('.hot-update.') },
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

    if (existSrc) {
      clearConsole();
      logger.log(chalk.cyan(`Starting the development server...`));
    } else {
      await printInstructions(api, appContext, userConfig);
    }
  });
};
