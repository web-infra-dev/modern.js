import { prettyInstructions, logger, isDev, chalk } from '@modern-js/utils';
import { mountHook, IAppContext, NormalizedConfig } from '@modern-js/core';

export const printInstructions = async (
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
  const { instructions } = await mountHook().beforePrintInstructions({
    instructions: message,
  });

  logger.log(instructions);
};
