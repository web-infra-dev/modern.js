import { prettyInstructions, logger, isDev, chalk } from '@modern-js/utils';
import { mountHook, IAppContext } from '@modern-js/core';

export const printInstructions = async (appContext: IAppContext) => {
  let message = prettyInstructions(appContext);

  if (isDev()) {
    message += `\n${chalk.cyanBright(
      [
        `Note that the development build is not optimized.`,
        `To create a production build, use yarn build.`,
      ].join('\n'),
    )}`;
  }

  // call beforePrintInstructions hook.
  const { instructions } = await (mountHook() as any).beforePrintInstructions({
    instructions: message,
  });

  logger.log(instructions);
};
