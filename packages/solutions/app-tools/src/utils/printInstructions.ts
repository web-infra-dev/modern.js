import { prettyInstructions, logger, isDev, chalk } from '@modern-js/utils';
import type { PluginAPI, IAppContext, NormalizedConfig } from '@modern-js/core';

export const printInstructions = async (
  api: PluginAPI,
  appContext: IAppContext,
  config: NormalizedConfig,
) => {
  let message = prettyInstructions(appContext, config);
  const { existSrc } = appContext;

  if (isDev() && existSrc) {
    message += `\n${chalk.cyanBright(
      [
        `Note that the development build is not optimized.`,
        `To create a production build, execute build command.`,
      ].join('\n'),
    )}`;
  }

  // call beforePrintInstructions hook.
  const hookRunners = api.useHookRunners();
  const { instructions } = await hookRunners.beforePrintInstructions({
    instructions: message,
  });

  logger.log(instructions);
};
