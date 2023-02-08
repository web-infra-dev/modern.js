import { prettyInstructions, logger } from '@modern-js/utils';
import type { IAppContext, CliHooksRunner } from '@modern-js/core';
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

  logger.info(instructions);
};
