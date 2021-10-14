import { logger, chalk } from '@modern-js/utils';
import { useAppContext, useResolvedConfigContext } from '@modern-js/core';
import server from '@modern-js/server';
import { printInstructions } from '../utils/printInstructions';

export const start = async () => {
  /* eslint-disable react-hooks/rules-of-hooks */
  const appContext = useAppContext();
  const userConfig = useResolvedConfigContext();
  /* eslint-enable react-hooks/rules-of-hooks */

  const { appDirectory, port } = appContext;

  logger.log(chalk.cyan(`Starting the modern server...`));

  const app = await server({
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
    await printInstructions(appContext, userConfig);
  });
};
