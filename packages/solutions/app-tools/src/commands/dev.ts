import {
  Configuration,
  getWebpackConfig,
  WebpackConfigTarget,
} from '@modern-js/webpack';
import {
  fs,
  logger,
  HMR_SOCK_PATH,
  clearConsole,
  chalk,
  isSSR,
} from '@modern-js/utils';
import {
  useAppContext,
  useResolvedConfigContext,
  mountHook,
  AppContext,
} from '@modern-js/core';

import { createCompiler } from '../utils/createCompiler';
import { createServer } from '../utils/createServer';
import { generateRoutes } from '../utils/routes';
import { printInstructions } from '../utils/printInstructions';
import { DevOptions } from '../utils/types';
import { getSpecifiedEntries } from '../utils/getSpecifiedEntries';

export const dev = async (options: DevOptions) => {
  /* eslint-disable react-hooks/rules-of-hooks */
  const appContext = useAppContext();
  const userConfig = useResolvedConfigContext();
  /* eslint-enable react-hooks/rules-of-hooks */

  const { appDirectory, distDirectory, port, existSrc, entrypoints } =
    appContext;

  if (options.entry) {
    const checkedEntries = await getSpecifiedEntries(
      options.entry || false,
      entrypoints,
    );

    AppContext.set({
      ...appContext,
      checkedEntries,
    });
    appContext.checkedEntries = checkedEntries;
  }

  fs.emptyDirSync(distDirectory);

  await (mountHook() as any).beforeDev();

  let compiler = null;
  if (existSrc) {
    const webpackConfigs = [
      isSSR(userConfig) && getWebpackConfig(WebpackConfigTarget.NODE),
      getWebpackConfig(WebpackConfigTarget.CLIENT),
    ].filter(Boolean) as Configuration[];

    compiler = await createCompiler({
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
    config: userConfig as any,
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
      await printInstructions(appContext, userConfig);
    }
  });
};
