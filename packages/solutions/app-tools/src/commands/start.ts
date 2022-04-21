import { logger, chalk, isApiOnly } from '@modern-js/utils';
import type { PluginAPI } from '@modern-js/core';
import server from '@modern-js/prod-server';
import { printInstructions } from '../utils/printInstructions';

export const start = async (api: PluginAPI) => {
  const appContext = api.useAppContext();
  const userConfig = api.useResolvedConfigContext();
  const hookRunners = api.useHookRunners();

  const { appDirectory, port, serverConfigFile } = appContext;

  logger.log(chalk.cyan(`Starting the modern server...`));
  const apiOnly = await isApiOnly(appContext.appDirectory);
  const app = await server({
    pwd: appDirectory,
    config: userConfig,
    plugins: appContext.plugins
      .filter((p: any) => p.server)
      .map((p: any) => p.server),
    serverConfigFile,
    apiOnly,
  });

  app.listen(port, async (err: Error) => {
    if (err) {
      throw err;
    }
    await printInstructions(hookRunners, appContext, userConfig);
  });
};
