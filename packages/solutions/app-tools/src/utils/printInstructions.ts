import type { CliHooksRunner, IAppContext } from '@modern-js/core';
import { logger, prettyInstructions } from '@modern-js/utils';
import type { AppNormalizedConfig, AppTools } from '../types';

export const printInstructions = async (
  hookRunners: CliHooksRunner<AppTools<'shared'>>,
  appContext: IAppContext,
  config: AppNormalizedConfig<'shared'>,
) => {
  const message = prettyInstructions(appContext, config);

  // call beforePrintInstructions hook.
  const { instructions } = await hookRunners.beforePrintInstructions({
    instructions: message,
  });

  logger.log(instructions);
};
