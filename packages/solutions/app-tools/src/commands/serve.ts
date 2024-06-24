import path from 'path';
import {
  logger,
  isApiOnly,
  getTargetDir,
  getMeta,
  SERVER_DIR,
} from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import { createProdServer } from '@modern-js/prod-server';
import { printInstructions } from '../utils/printInstructions';
import type { AppTools } from '../types';
import { loadServerPlugins } from '../utils/loadPlugins';

export const start = async (api: PluginAPI<AppTools<'shared'>>) => {
  const appContext = api.useAppContext();
  const userConfig = api.useResolvedConfigContext();
  const hookRunners = api.useHookRunners();

  const {
    distDirectory,
    appDirectory,
    port,
    metaName,
    serverRoutes,
    serverConfigFile,
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

  const meta = getMeta(metaName);
  const serverConfigPath = path.resolve(
    distDirectory,
    SERVER_DIR,
    `${meta}.server`,
  );

  const pluginInstances = await loadServerPlugins(api, appDirectory, metaName);

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
    plugins: pluginInstances,
    serverConfigFile,
    serverConfigPath,
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
    runMode,
  });

  app.listen(port, async () => {
    await printInstructions(hookRunners, appContext, userConfig);
  });
};
