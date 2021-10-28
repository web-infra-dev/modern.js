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
} from '@modern-js/core';
import { createCompiler } from '../utils/createCompiler';
import { createServer } from '../utils/createServer';

export const dev = async () => {
  /* eslint-disable react-hooks/rules-of-hooks */
  const appContext = useAppContext();
  const userConfig = useResolvedConfigContext();
  /* eslint-enable react-hooks/rules-of-hooks */

  const { appDirectory, distDirectory, port } = appContext;

  fs.emptyDirSync(distDirectory);

  await (mountHook() as any).beforeDev();

  const webpackConfigs = [
    isSSR(userConfig) && getWebpackConfig(WebpackConfigTarget.NODE),
    getWebpackConfig(WebpackConfigTarget.CLIENT),
  ].filter(Boolean) as Configuration[];

  const compiler = await createCompiler({
    webpackConfigs,
    userConfig,
    appContext,
  });

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

  app.listen(port, (err: Error) => {
    if (err) {
      throw err;
    }

    clearConsole();

    logger.log(chalk.cyan(`Starting the development server...`));
  });
};
