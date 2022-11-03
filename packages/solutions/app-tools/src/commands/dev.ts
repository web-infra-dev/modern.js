import { fs, logger, isSSR } from '@modern-js/utils';
import { PluginAPI, ResolvedConfigContext } from '@modern-js/core';
import { BuilderTarget } from '@modern-js/builder';
import { createDevCompiler } from '../utils/createCompiler';
import { createServer } from '../utils/createServer';
import { generateRoutes } from '../utils/routes';
import { printInstructions } from '../utils/printInstructions';
import { DevOptions } from '../utils/types';
import { getSpecifiedEntries } from '../utils/getSpecifiedEntries';
import { buildServerConfig } from '../utils/config';
import type { AppHooks } from '../hooks';

export const dev = async (api: PluginAPI<AppHooks>, options: DevOptions) => {
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
    const target: BuilderTarget[] = isSSR(userConfig)
      ? ['web', 'node']
      : ['web'];
    compiler = await createDevCompiler({
      target,
      api,
      normalizedConfig: userConfig,
      appContext,
    });
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
    internalPlugins: serverInternalPlugins,
  });

  app.listen(port, async (err: Error) => {
    if (err) {
      throw err;
    }

    logger.info(`Starting dev server...`);

    return printInstructions(hookRunners, appContext, userConfig);
  });
};
