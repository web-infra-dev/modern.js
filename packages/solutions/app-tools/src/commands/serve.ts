import path from 'path';
import type { CLIPluginAPI } from '@modern-js/plugin-v2';
import { createProdServer } from '@modern-js/prod-server';
import {
  SERVER_DIR,
  getMeta,
  getTargetDir,
  isApiOnly,
  logger,
} from '@modern-js/utils';
import type { AppNormalizedConfig, AppTools } from '../types';
import { loadServerPlugins } from '../utils/loadPlugins';
import { printInstructions } from '../utils/printInstructions';

export const start = async (api: CLIPluginAPI<AppTools<'shared'>>) => {
  const appContext = api.getAppContext();
  const userConfig = api.getNormalizedConfig();
  const hooks = api.getHooks();

  const {
    distDirectory,
    appDirectory,
    internalDirectory,
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
      // server-core can't get RegExp & Function output.enableInlineScripts by JSON.stringy;
      output: {
        path: userConfig.output.distPath?.root,
        ...(userConfig.output || {}),
      } as any,
    },
    routes: serverRoutes,
    plugins: pluginInstances,
    serverConfigFile,
    serverConfigPath,
    appContext: {
      appDirectory,
      internalDirectory,
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
    await printInstructions(
      hooks,
      appContext,
      userConfig as AppNormalizedConfig<'shared'>,
    );
  });
};
