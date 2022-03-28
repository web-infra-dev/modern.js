import { chalk, logger } from '@modern-js/utils';
import type { IAppContext, NormalizedConfig, PluginAPI } from '@modern-js/core';

export const startTimer = {
  start: 0,
  end: 0,
};

export const dev = async (
  api: PluginAPI,
  config: NormalizedConfig,
  appContext: IAppContext,
) => {
  logger.log(chalk.cyanBright(`Starting the development server...\n`));

  startTimer.start = Date.now();

  const [{ startDevServer }, { createHtml }] = await Promise.all([
    import('./server'),
    import('./create-entry'),
  ]);

  // create html template for each js entry
  createHtml(config, appContext);

  const closeServer = await startDevServer(api, config, appContext);
  return closeServer;
};
