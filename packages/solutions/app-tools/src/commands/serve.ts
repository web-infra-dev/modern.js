import { logger, isApiOnly, getTargetDir } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import { createProdServer } from '@modern-js/prod-server-new';
import { printInstructions } from '../utils/printInstructions';
import type { AppTools } from '../types';
import { injectDataLoaderPlugin } from '../utils/createServer';
import { getServerInternalPlugins } from '../utils/getServerInternalPlugins';

export const start = async (api: PluginAPI<AppTools<'shared'>>) => {
  const appContext = api.useAppContext();
  const userConfig = api.useResolvedConfigContext();
  const hookRunners = api.useHookRunners();

  const { appDirectory, port, serverConfigFile, metaName, serverRoutes } =
    appContext;

  logger.info(`Starting production server...`);
  const apiOnly = await isApiOnly(
    appContext.appDirectory,
    userConfig?.source?.entriesDir,
    appContext.apiDirectory,
  );
  const serverInternalPlugins = await getServerInternalPlugins(api);

  const app = await createProdServer({
    pwd: appDirectory,
    config: {
      ...userConfig,
      dev: userConfig.dev as any,
      output: {
        path: userConfig.output.distPath?.root,
        ...(userConfig.output || {}),
      },
    },
    routes: apiOnly ? undefined : serverRoutes,
    appContext: {
      metaName,
      sharedDirectory: getTargetDir(
        appContext.sharedDirectory,
        appContext.appDirectory,
        appContext.distDirectory,
      ),
      apiDirectory: getTargetDir(
        appContext.apiDirectory,
        appContext.appDirectory,
        appContext.distDirectory,
      ),
      lambdaDirectory: getTargetDir(
        appContext.lambdaDirectory,
        appContext.appDirectory,
        appContext.distDirectory,
      ),
    },
    serverConfigFile,
    internalPlugins: injectDataLoaderPlugin(serverInternalPlugins),
    apiOnly,
  });

  app.listen(port, async () => {
    await printInstructions(hookRunners, appContext, userConfig);
  });
};
