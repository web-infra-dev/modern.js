import { logger, chalk, isApiOnly } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import server from '@modern-js/prod-server';
import { printInstructions } from '../utils/printInstructions';
import type { AppTools } from '../types';
import { injectDataLoaderPlugin } from '../utils/createServer';
import { getServerInternalPlugins } from '../utils/getServerInternalPlugins';

export const start = async (api: PluginAPI<AppTools>) => {
  const appContext = api.useAppContext();
  const userConfig = api.useResolvedConfigContext();
  const hookRunners = api.useHookRunners();

  const { appDirectory, port, serverConfigFile } = appContext;

  logger.log(chalk.cyan(`Starting the modern server...`));
  const apiOnly = await isApiOnly(
    appContext.appDirectory,
    userConfig?.source?.entriesDir,
  );
  const serverInternalPlugins = await getServerInternalPlugins(api);

  const app = await server({
    pwd: appDirectory,
    config: userConfig as any,
    serverConfigFile,
    internalPlugins: injectDataLoaderPlugin(serverInternalPlugins),
    apiOnly,
  });

  app.listen(port, async (err: Error) => {
    if (err) {
      throw err;
    }
    await printInstructions(hookRunners, appContext, userConfig);
  });
};
