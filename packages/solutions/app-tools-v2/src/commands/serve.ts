import { logger, isApiOnly, getTargetDir } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import { createProdServer } from '@modern-js/prod-server';
import { printInstructions } from '../utils/instruction';
import type { AppTools } from '../types';
import { getServerInternalPlugins } from '../utils/server';

export const start = async (api: PluginAPI<AppTools<'shared'>>) => {
  const appContext = api.useAppContext();
  const userConfig = api.useResolvedConfigContext();
  const hookRunners = api.useHookRunners();

  const {
    distDirectory,
    appDirectory,
    port,
    serverConfigFile,
    metaName,
    serverRoutes,
  } = appContext;

  logger.info(`Starting production server...`);
  const apiOnly = await isApiOnly(
    appContext.appDirectory,
    userConfig?.source?.entriesDir,
    appContext.apiDirectory,
  );

  let runMode: 'apiOnly' | undefined;
  if (apiOnly) {
    runMode = 'apiOnly';
  }

  const serverInternalPlugins = await getServerInternalPlugins(api);

  const app = await createProdServer({
    metaName,
    pwd: distDirectory,
    config: {
      ...userConfig,
      dev: userConfig.dev as any,
      output: {
        path: userConfig.output.distPath?.root,
        ...(userConfig.output || {}),
      },
    },
    routes: serverRoutes,
    appContext: {
      appDirectory,
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
    internalPlugins: serverInternalPlugins,
    runMode,
  });

  app.listen(port, async () => {
    await printInstructions(hookRunners, appContext, userConfig);
  });
};
